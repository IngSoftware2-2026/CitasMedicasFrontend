import { Observable } from 'rxjs';

export interface LoginRequest {
  correo: string;
  clave: string;
}

export interface LoginResponse {
  usuarioId: number;
  nombreUsuario: string;
  correo: string;
  token: string;
  rolId: number;
}

export interface UsuarioRequest {
  nombreUsuario?: string;
  correo?: string;
  telefono?: string;
  clave?: string;
  rolId: number;
  activo: boolean;
}

export interface UsuarioResponse {
  usuarioId: number;
  nombreUsuario: string;
  correo: string;
  telefono?: string;
  rolId: number;
  activo: boolean;
  fechaCreacion: string;
}

export interface IUsuarioService {
  login(credentials: LoginRequest): Observable<LoginResponse>;
  listar(): Observable<UsuarioResponse[]>;
  obtenerPorId(id: number): Observable<UsuarioResponse | null>;
  insertar(data: UsuarioRequest): Observable<UsuarioResponse>;
  actualizar(id: number, data: UsuarioRequest): Observable<UsuarioResponse>;
  eliminar(id: number): Observable<boolean>;
}
