import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../../core/services/Accesos/usuario.service';
import { Usuario } from '../../../../core/models/Accesos/usuario.model';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';

@Injectable()
export class UsuariosCrud {
  private usuarioService = inject(UsuarioService);
  private messageService = inject(MessageService);
  
  private destroy$ = new Subject<void>();
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  usuarios$ = this.usuariosSubject.asObservable();
  
  get usuarios(): Usuario[] {
    return this.usuariosSubject.getValue();
  }

  constructor() {
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    console.log('Cargando usuarios...');
    this.usuarioService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Usuarios cargados:', data);
          this.usuariosSubject.next(data);
        },
        error: (err) => {
          console.error('Error cargando usuarios:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar usuarios' });
          this.usuariosSubject.next([]);
        }
      });
  }

  save(u: Partial<Usuario>, isEdit: boolean): void {
    if (!u.nombreUsuario || !u.correo || !u.rolId) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Nombre, correo y rol son obligatorios' });
      return;
    }
    if (!isEdit && !u.clave) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'La contraseña es obligatoria para nuevos usuarios' });
      return;
    }

    if (isEdit && u.usuarioId) {
      this.usuarioService.actualizarUsuario(u.usuarioId, u)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsuarios();
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar usuario' })
        });
    } else {
      console.log('Datos a insertar:', JSON.stringify(u));
      this.usuarioService.insertar(u)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsuarios();
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Usuario creado' });
          },
          error: (err) => {
            console.error('Error insertar usuario:', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear usuario' });
          }
        });
    }
  }

  delete(u: Usuario, onConfirm: () => void): void {
    this.usuarioService.eliminarUsuario(u.usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsuarios();
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado' });
          onConfirm();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar usuario' })
      });
  }

  toggle(u: Usuario): void {
    const newActivo = !u.activo;
    const payload = {
      nombreUsuario: u.nombreUsuario || '',
      correo: u.correo || '',
      telefono: u.telefono || '',
      rolId: u.rolId || 1,
      activo: newActivo
    };
    console.log('Toggle payload:', JSON.stringify(payload));
    this.usuarioService.actualizarUsuario(u.usuarioId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsuarios();
          this.messageService.add({ severity: 'info', summary: newActivo ? 'Activado' : 'Desactivado', detail: `${u.nombreUsuario} ${newActivo ? 'activado' : 'desactivado'}` });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar estado' })
      });
  }
}
