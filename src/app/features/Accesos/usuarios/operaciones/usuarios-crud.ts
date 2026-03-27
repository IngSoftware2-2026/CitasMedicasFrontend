import { Injectable, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioService } from '../../../../core/services/Accesos/usuarios/usuario.service';
import { RefreshManager } from '../../../../core/shared/services/data-refresh.service';
import { Usuario } from '../../../../core/models/Accesos/usuario.model';

@Injectable()
export class UsuariosCrud {
  private usuarioService = inject(UsuarioService);
  private messageService = inject(MessageService);
  private refreshManager = inject(RefreshManager);
  private cdr: ChangeDetectorRef | null = null;
  private destroy$ = new Subject<void>();
  private usuariosSubject = new Subject<Usuario[]>();
  usuarios$ = this.usuariosSubject.asObservable();

  setCdr(cdr: ChangeDetectorRef): void {
    this.cdr = cdr;
  }

  cargarUsuarios(): void {
    this.usuarioService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.usuariosSubject.next(usuarios);
          this.cdr?.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.mostrarMensaje('error', 'Error', 'No se pudieron cargar los usuarios');
          this.usuariosSubject.next([]);
        }
      });
  }

  guardar(datos: Partial<Usuario>, esEdicion: boolean): void {
    if (!datos.nombreUsuario?.trim()) {
      this.mostrarMensaje('warn', 'Requerido', 'El nombre de usuario es obligatorio');
      return;
    }

    if (!datos.correo?.trim()) {
      this.mostrarMensaje('warn', 'Requerido', 'El correo es obligatorio');
      return;
    }

    if (esEdicion) {
      this.actualizar(datos);
    } else {
      this.crear(datos);
    }
  }

  toggleEstado(usuario: Usuario): void {
    const nuevoEstado = !usuario.activo;
    const accion = nuevoEstado ? 'activado' : 'desactivado';

    const payload = {
      nombreUsuario: usuario.nombreUsuario || '',
      correo: usuario.correo || '',
      telefono: usuario.telefono || '',
      rolId: usuario.rolId || 1,
      activo: nuevoEstado
    };

    this.usuarioService.actualizarUsuario(usuario.usuarioId!, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshManager.refresh('usuarios');
          this.mostrarMensaje('success', 'Éxito', `Usuario ${accion} correctamente`);
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.mostrarMensaje('error', 'Error', 'No se pudo cambiar el estado');
        }
      });
  }

  obtenerDetalle(usuarioId: number): Promise<Usuario | null> {
    return new Promise((resolve) => {
      this.usuarioService.obtenerPorId(usuarioId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (usuario) => {
            resolve(usuario);
          },
          error: (error) => {
            console.error('Error al obtener detalle:', error);
            this.mostrarMensaje('error', 'Error', 'No se pudo cargar los detalles');
            resolve(null);
          }
        });
    });
  }

  eliminar(usuario: Usuario): void {
    this.usuarioService.eliminarUsuario(usuario.usuarioId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshManager.refresh('usuarios');
          this.mostrarMensaje('success', 'Eliminado', 'Usuario eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.mostrarMensaje('error', 'Error', 'No se pudo eliminar el usuario');
        }
      });
  }

  private crear(datos: Partial<Usuario>): void {
    this.usuarioService.insertar(datos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshManager.refresh('usuarios');
          this.mostrarMensaje('success', 'Creado', 'Usuario creado exitosamente');
        },
        error: (error) => {
          console.error('Error al crear:', error);
          this.mostrarMensaje('error', 'Error', 'No se pudo crear el usuario');
        }
      });
  }

  private actualizar(datos: Partial<Usuario>): void {
    if (!datos.usuarioId) return;

    this.usuarioService.actualizarUsuario(datos.usuarioId, datos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshManager.refresh('usuarios');
          this.mostrarMensaje('success', 'Actualizado', 'Usuario actualizado exitosamente');
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.mostrarMensaje('error', 'Error', 'No se pudo actualizar el usuario');
        }
      });
  }

  private mostrarMensaje(severity: 'success' | 'error' | 'warn' | 'info', summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail });
    this.cdr?.detectChanges();
  }
}
