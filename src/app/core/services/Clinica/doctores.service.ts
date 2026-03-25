import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Doctor, DoctorDetalle } from '../../models/Clinica/Doctores/doctor.model';

/**
 * Servicio para gestión de doctores.
 * IMPORTANTE: La API de doctores retorna JSON directo (NO usa wrapper Respuesta<T>).
 * GET /api/doctores → DoctoresDTO[] directamente
 * GET /api/doctores/{id} → DoctoresDTO directamente
 * POST /api/doctores → { medicoId: number }
 */
@Injectable({ providedIn: 'root' })
export class DoctoresService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/doctores`;

  // ==================== DOCTORS CRUD ====================

  listar(activo?: boolean, especialidadId?: number): Observable<Doctor[]> {
    let params = new HttpParams();
    if (activo !== undefined) params = params.set('activo', activo.toString());
    if (especialidadId) params = params.set('especialidadId', especialidadId.toString());

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => {
        console.log('[DoctoresService] listar RAW:', res);
        // API returns array directly - NO envelope
        const list = Array.isArray(res) ? res : (res?.datos || res?.data || []);
        return this.normalizeDoctorList(list);
      }),
      catchError(err => {
        console.error('[DoctoresService] listar error:', err);
        return of([]);
      })
    );
  }

  obtenerPorId(id: number): Observable<DoctorDetalle | null> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => {
        console.log('[DoctoresService] obtenerPorId RAW:', res);
        // API returns DoctoresDTO directly - NO envelope
        if (!res) return null;
        return this.normalizeDoctor(res) as DoctorDetalle;
      }),
      catchError(err => {
        console.error('[DoctoresService] obtenerPorId error:', err);
        return of(null);
      })
    );
  }

  /**
   * Crea un doctor. El backend ahora retorna { medicoId: number }.
   */
  crear(doctor: Partial<Doctor>): Observable<{ medicoId: number }> {
    const payload = {
      medicoId: 0,
      nombrePublico: doctor.nombrePublico || '',
      usuarioId: doctor.usuarioId || 0,
      salaPredeterminadaId: (doctor as any).salaPredeterminadaId || null,
      duracionIntervaloMinutos: doctor.duracionIntervaloMinutos || 10,
      duracionDefaultMinutos: doctor.duracionDefaultMinutos || 30,
      minutosBuffer: doctor.minutosBuffer || 0,
      activo: true
    };
    console.log('[DoctoresService] crear payload:', payload);

    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(res => {
        console.log('[DoctoresService] crear response:', res);
        // Backend returns { medicoId: X } directly
        return { medicoId: res?.medicoId || res?.MedicoId || 0 };
      })
    );
  }

  editar(id: number, doctor: Partial<Doctor>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, doctor);
  }

  cambiarActivo(id: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/activo?activo=${activo}`, {});
  }

  // ==================== SPECIALTIES ====================

  /**
   * Lista las especialidades de un doctor.
   * Endpoint nuevo: GET /api/doctores/{id}/especialidades
   * Retorna DoctorEspecialidadDTO[] directamente.
   */
  listarEspecialidades(medicoId: number): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/${medicoId}/especialidades`).pipe(
      map(res => {
        console.log('[DoctoresService] listarEspecialidades RAW:', res);
        const list = Array.isArray(res) ? res : (res?.datos || res?.data || []);
        return list.map((e: any) => ({
          especialidadId: e.especialidadId ?? e.EspecialidadId,
          nombreEspecialidad: e.nombreEspecialidad ?? e.NombreEspecialidad ?? '',
          principal: e.principal ?? e.Principal ?? false
        }));
      }),
      catchError(err => {
        console.error('[DoctoresService] listarEspecialidades error:', err);
        return of([]);
      })
    );
  }

  asignarEspecialidad(id: number, especialidadId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/especialidades?especialidadId=${especialidadId}`, {});
  }

  removerEspecialidad(id: number, especialidadId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/especialidades/${especialidadId}`);
  }

  setEspecialidadPrincipal(id: number, especialidadId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/especialidades/${especialidadId}/principal`, {});
  }

  // ==================== SALAS ====================

  /** Lista las salas activas directo desde la base de datos para evitar errores de FK */
  listarSalas(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/salas`).pipe(
      map(res => {
        console.log('[DoctoresService] listarSalas RAW:', res);
        const list = Array.isArray(res) ? res : (res?.datos || res?.data || []);
        return list.map((s: any) => ({
          salaId: s.salaId ?? s.SalaId,
          codigoSala: s.codigoSala ?? s.CodigoSala ?? '',
          nombreSala: s.nombreSala ?? s.NombreSala ?? '',
          ubicacion: s.ubicacion ?? s.Ubicacion ?? '',
          activo: s.activo ?? s.Activo ?? true
        }));
      }),
      catchError(err => {
        console.error('[DoctoresService] listarSalas error:', err);
        return of([]);
      })
    );
  }

  // ==================== HORARIOS ====================

  listarHorarios(medicoId: number): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/${medicoId}/horarios`).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.datos || res?.data || []);
        return list.map((h: any) => ({
          horarioId: h.horarioId ?? h.HorarioId,
          doctorId: h.doctorId ?? h.DoctorId ?? h.medicoId,
          medicoId: h.doctorId ?? h.DoctorId ?? h.medicoId,
          diaSemana: h.diaSemana ?? h.DiaSemana,
          horaInicio: h.horaInicio ?? h.HoraInicio,
          horaFin: h.horaFin ?? h.HoraFin,
          activo: h.activo ?? h.Activo ?? true
        }));
      }),
      catchError(err => {
        console.error('[DoctoresService] listarHorarios error:', err);
        return of([]);
      })
    );
  }

  crearHorario(horario: any): Observable<any> {
    const payload = {
      doctorId: horario.doctorId ?? horario.medicoId,
      diaSemana: Number(horario.diaSemana),
      horaInicio: typeof horario.horaInicio === 'string' && horario.horaInicio.length === 5 ? horario.horaInicio + ':00' : horario.horaInicio,
      horaFin: typeof horario.horaFin === 'string' && horario.horaFin.length === 5 ? horario.horaFin + ':00' : horario.horaFin,
      activo: true
    };
    return this.http.post<any>(`${this.baseUrl}/horarios`, payload);
  }

  actualizarHorario(horario: any): Observable<any> {
    const payload = {
      horarioId: horario.horarioId,
      doctorId: horario.doctorId ?? horario.medicoId,
      diaSemana: Number(horario.diaSemana),
      horaInicio: typeof horario.horaInicio === 'string' && horario.horaInicio.length === 5 ? horario.horaInicio + ':00' : horario.horaInicio,
      horaFin: typeof horario.horaFin === 'string' && horario.horaFin.length === 5 ? horario.horaFin + ':00' : horario.horaFin,
      activo: horario.activo
    };
    return this.http.put<any>(`${this.baseUrl}/horarios`, payload);
  }

  eliminarHorario(horarioId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/horarios/${horarioId}`);
  }

  // ==================== NORMALIZATION ====================

  /** Normalize PascalCase → camelCase for a list of doctors and Deduplicate by MedicoId */
  private normalizeDoctorList(list: any[]): Doctor[] {
    const grouped = new Map<number, any>();

    for (const d of list) {
      const id = d.medicoId ?? d.MedicoId;
      if (!id) continue;

      const specName = d.nombreEspecialidad ?? d.NombreEspecialidad ?? '';

      if (!grouped.has(id)) {
        const normalized = this.normalizeDoctor(d);
        normalized._especialidadesList = specName ? [specName] : [];
        grouped.set(id, normalized);
      } else {
        const existing = grouped.get(id);
        if (specName && !existing._especialidadesList.includes(specName)) {
          existing._especialidadesList.push(specName);
        }
      }
    }

    return Array.from(grouped.values()).map(doc => {
      if (doc._especialidadesList && doc._especialidadesList.length > 0) {
        // Formatear como "Cardiología, Pediatría (+1)" o similar, 
        // o simplemente unir con comas
        doc.nombreEspecialidad = doc._especialidadesList.join(', ');
      }
      delete doc._especialidadesList;
      return doc as Doctor;
    });
  }

  /** Normalize a single doctor object from backend PascalCase to frontend camelCase */
  private normalizeDoctor(d: any): any {
    return {
      medicoId: d.medicoId ?? d.MedicoId,
      nombrePublico: d.nombrePublico ?? d.NombrePublico ?? '',
      usuarioId: d.usuarioId ?? d.UsuarioId,
      salaPredeterminadaId: d.salaPredeterminadaId ?? d.SalaPredeterminadaId ?? null,
      duracionIntervaloMinutos: d.duracionIntervaloMinutos ?? d.DuracionIntervaloMinutos ?? 10,
      duracionDefaultMinutos: d.duracionDefaultMinutos ?? d.DuracionDefaultMinutos ?? 30,
      minutosBuffer: d.minutosBuffer ?? d.MinutosBuffer ?? 0,
      activo: d.activo ?? d.Activo ?? true,
      // Specialty/Sala from SP join (may or may not be present)
      nombreEspecialidad: d.nombreEspecialidad ?? d.NombreEspecialidad ?? '',
      nombreSala: d.nombreSala ?? d.NombreSala ?? '',
    };
  }
}
