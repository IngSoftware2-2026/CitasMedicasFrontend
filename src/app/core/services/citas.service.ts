import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CitasCambiarEstadoRequest } from '../models/Clinica/Citas/citas-cambiar-estado.model';
import { CitasFiltroRequest } from '../models/Clinica/Citas/citas-filtro.model';
import { CitasInsertarRequest } from '../models/Clinica/Citas/citas-insertar.model';
import { DoctorListado } from '../models/Clinica/Doctores/doctor-listado.model';
import { PacienteListado } from '../models/Clinica/Pacientes/paciente-listado.model';
import { CitaDetalleResponse, CitaListadoResponse } from '../models/Clinica/Citas/citas-read.model';
import { Sala } from '../models/Catalogos/sala.model';
import { RequestStatusResponse } from '../models/request-status.model';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private readonly baseUrl = `${environment.apiUrl}/Citas`;

  constructor(private http: HttpClient) {}

  obtenerPorFiltro(filtro: CitasFiltroRequest): Observable<ApiResponse<CitaListadoResponse[]>> {
    return this.http.post<ApiResponse<CitaListadoResponse[]>>(`${this.baseUrl}/ObtenerPorFiltro`, filtro);
  }

  obtenerPorId(citaId: number): Observable<ApiResponse<CitaDetalleResponse>> {
    const params = new HttpParams().set('citaId', citaId);
    return this.http.get<ApiResponse<CitaDetalleResponse>>(`${this.baseUrl}/ObtenerPorId`, { params });
  }

  insertar(cita: CitasInsertarRequest): Observable<ApiResponse<RequestStatusResponse>> {
    return this.http.post<ApiResponse<RequestStatusResponse>>(`${this.baseUrl}/Insertar`, cita);
  }

  cambiarEstado(cambioEstado: CitasCambiarEstadoRequest): Observable<ApiResponse<RequestStatusResponse>> {
    return this.http.post<ApiResponse<RequestStatusResponse>>(`${this.baseUrl}/CambiarEstado`, cambioEstado);
  }

  listarPacientes(): Observable<ApiResponse<PacienteListado[]>> {
    return this.http.get<ApiResponse<PacienteListado[]>>(`${environment.apiUrl}/Pacientes/Listar`);
  }

  listarDoctores(): Observable<DoctorListado[]> {
    return this.http.get<DoctorListado[]>(`${environment.apiUrl}/api/doctores`);
  }

  listarSalas(): Observable<ApiResponse<Sala[]>> {
    return this.http.get<ApiResponse<Sala[]>>(`${environment.apiUrl}/Salas/Listar`);
  }
}
