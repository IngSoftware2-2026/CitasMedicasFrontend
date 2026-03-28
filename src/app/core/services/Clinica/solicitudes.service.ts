import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import {
  SolicitudPublicaInsertarDTO,
  SolicitudUsuarioInsertarDTO,
  SolicitudPublicaListadoDTO,
  SolicitudCitaListadoDTO,
  SolicitudesFiltroDTO,
  CambiarEstadoSolicitudDTO,
  CitaInsertarDTO,
  DoctorPublicoDTO,
  PropuestaReprogramacionInsertarDTO,
  AceptarPropuestaDTO
} from '../../models/Clinica/Solicitudes/solicitud-publica.model';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ═══════ PÚBLICO — sin token ═══════

  /** Lista doctores activos — endpoint público, sin JWT */
  listarDoctoresPublicos(): Observable<ApiResponse<DoctorPublicoDTO[]>> {
    return this.http.get<ApiResponse<DoctorPublicoDTO[]>>(
      `${this.baseUrl}/Doctores/Listar`,
      { params: new HttpParams().set('activo', 'true') }
    );
  }

  /** Inserta solicitud pública — endpoint público, sin JWT */
  insertarPublica(dto: SolicitudPublicaInsertarDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/Publicas/Insertar`, dto
    );
  }

  insertarUsuario(dto: SolicitudUsuarioInsertarDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/Usuarios/Insertar`, dto
    );
  }

  // ═══════ ADMIN — SOLICITUDES PÚBLICAS ═══════

  listarPublicas(filtro: SolicitudesFiltroDTO): Observable<ApiResponse<SolicitudPublicaListadoDTO[]>> {
    return this.http.post<ApiResponse<SolicitudPublicaListadoDTO[]>>(
      `${this.baseUrl}/Publicas/Listar`, filtro
    );
  }

  obtenerPublicaPorId(id: number): Observable<ApiResponse<SolicitudPublicaListadoDTO>> {
    const params = new HttpParams().set('solicitudId', id);
    return this.http.get<ApiResponse<SolicitudPublicaListadoDTO>>(
      `${this.baseUrl}/Publicas/ObtenerPorId`, { params }
    );
  }

  cambiarEstadoPublica(dto: CambiarEstadoSolicitudDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/Publicas/CambiarEstado`, dto
    );
  }

  // ═══════ ADMIN — SOLICITUDES DE USUARIO ═══════

  listarUsuarios(filtro: SolicitudesFiltroDTO): Observable<ApiResponse<SolicitudCitaListadoDTO[]>> {
    return this.http.post<ApiResponse<SolicitudCitaListadoDTO[]>>(
      `${this.baseUrl}/Usuarios/Listar`, filtro
    );
  }

  obtenerUsuarioPorId(id: number): Observable<ApiResponse<SolicitudCitaListadoDTO>> {
    const params = new HttpParams().set('solicitudId', id);
    return this.http.get<ApiResponse<SolicitudCitaListadoDTO>>(
      `${this.baseUrl}/Usuarios/ObtenerPorId`, { params }
    );
  }

  cambiarEstadoUsuario(dto: CambiarEstadoSolicitudDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/Usuarios/CambiarEstado`, dto
    );
  }

  // ═══════ CITAS ═══════

  crearCita(dto: CitaInsertarDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/Citas/Insertar`, dto
    );
  }

  // ═══════ PROPUESTAS DE REPROGRAMACIÓN ═══════

  crearPropuesta(dto: PropuestaReprogramacionInsertarDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/PropuestasReprogramacion/Crear`, dto
    );
  }

  aceptarPropuesta(dto: AceptarPropuestaDTO): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/PropuestasReprogramacion/Aceptar`, dto
    );
  }

  rechazarPropuesta(propuestaId: number): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('propuestaId', propuestaId);
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/PropuestasReprogramacion/Rechazar`, { params }
    );
  }
}
