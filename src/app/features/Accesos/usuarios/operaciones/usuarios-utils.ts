import { Injectable, inject } from '@angular/core';
import { RolService } from '../../../../core/services/Accesos/rol.service';
import { Usuario } from '../../../../core/models/Accesos/usuario.model';
import { Rol } from '../../../../core/models/Accesos/rol.model';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';

@Injectable()
export class UsuariosUtils {
  private rolService = inject(RolService);
  private destroy$ = new Subject<void>();
  private rolesSubject = new BehaviorSubject<Rol[]>([]);
  
  roles$ = this.rolesSubject.asObservable();
  
  usuarios: Usuario[] = [];
  
  get roles(): Rol[] {
    return this.rolesSubject.getValue();
  }

  constructor() {
    this.loadRoles();
  }

  private loadRoles(): void {
    console.log('Cargando roles...');
    this.rolService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Roles cargados:', data);
          this.rolesSubject.next(data);
        },
        error: (err) => {
          console.error('Error cargando roles:', err);
          this.rolesSubject.next([]);
        }
      });
  }

  setUsuarios(data: Usuario[]): void {
    this.usuarios = data;
  }

  countActivos(): number { return this.usuarios.filter(u => u.activo).length; }
  countInactivos(): number { return this.usuarios.filter(u => !u.activo).length; }
  countByRol(rolId: number): number { return this.usuarios.filter(u => u.rolId === rolId).length; }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  getRolAvatarColor(rolId: number): string {
    const codigo = this.getRolCodigo(rolId);
    switch (codigo) {
      case 'ADMIN': return '--red';
      case 'DOCTOR': return '--teal';
      case 'RECEP': return '--amber';
      case 'PACIENTE': return '--blue';
      default: return '--indigo';
    }
  }

  filterUsuarios(term: string, usuarios: Usuario[]): Usuario[] {
    const t = term.toLowerCase();
    if (!t) return usuarios;
    return usuarios.filter(u =>
      u.nombreUsuario.toLowerCase().includes(t) ||
      u.correo.toLowerCase().includes(t) ||
      this.getRolNombre(u.rolId).toLowerCase().includes(t)
    );
  }

  getRolNombre(rolId: number): string {
    return this.roles.find(r => r.rolId === rolId)?.nombreRol ?? 'Sin rol';
  }

  getRolCodigo(rolId: number): string {
    return this.roles.find(r => r.rolId === rolId)?.codigoRol ?? '';
  }

  getRolSeverity(rolId: number): 'danger' | 'info' | 'warn' | 'success' | 'secondary' {
    const codigo = this.getRolCodigo(rolId);
    switch (codigo) {
      case 'ADMIN': return 'danger';
      case 'DOCTOR': return 'info';
      case 'RECEP': return 'warn';
      case 'PACIENTE': return 'success';
      default: return 'secondary';
    }
  }
}
