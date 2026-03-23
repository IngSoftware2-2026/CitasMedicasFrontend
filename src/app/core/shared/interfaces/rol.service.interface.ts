import { Observable } from 'rxjs';

export interface RolRequest {
  codigoRol: string;
  nombreRol: string;
}

export interface RolResponse {
  rolId: number;
  codigoRol: string;
  nombreRol: string;
}

export interface IRolService {
  listar(): Observable<RolResponse[]>;
  obtenerPorId(id: number): Observable<RolResponse | null>;
  insertar(data: RolRequest): Observable<RolResponse>;
  actualizar(id: number, data: RolRequest): Observable<RolResponse>;
  eliminar(id: number): Observable<boolean>;
}
