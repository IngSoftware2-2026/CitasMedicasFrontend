import { Injectable, inject, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { RolService } from '../../../../core/services/Accesos/roles/rol.service';
import { Rol } from '../../../../core/models/Accesos/rol.model';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';

@Injectable()
export class RolesAdminService {
  private rolService = inject(RolService);
  private messageService = inject(MessageService);
  private changeDetector: ChangeDetectorRef | null = null;
  
  private destroy$ = new Subject<void>();
  private rolesSubject = new BehaviorSubject<Rol[]>([]);
  roles$ = this.rolesSubject.asObservable();

  constructor() {
    this.obtenerRoles();
  }

  setChangeDetector(cdr: ChangeDetectorRef): void {
    this.changeDetector = cdr;
  }

  private obtenerRoles(): void {
    this.rolService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.rolesSubject.next(roles || []);
          this.changeDetector?.detectChanges();
        },
        error: (error) => {
          console.error('Error cargando roles:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar roles' });
          this.rolesSubject.next([]);
          this.changeDetector?.detectChanges();
        }
      });
  }

  get listaRoles(): Rol[] {
    return this.rolesSubject.getValue();
  }

  guardarRol(rol: Partial<Rol>, esEdicion: boolean): void {
    if (!rol.codigoRol || !rol.nombreRol) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Código y nombre son obligatorios' });
      return;
    }

    if (esEdicion && rol.rolId) {
      this.actualizarRol(rol);
    } else {
      this.crearRol(rol);
    }
  }

  private crearRol(rol: Partial<Rol>): void {
    this.rolService.insertar(rol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.obtenerRoles();
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Rol creado exitosamente' });
          this.changeDetector?.detectChanges();
        },
        error: (error) => {
          console.error('Error creando rol:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.mensaje || 'Error al crear rol' });
          this.changeDetector?.detectChanges();
        }
      });
  }

  private actualizarRol(rol: Partial<Rol>): void {
    this.rolService.actualizarRol(rol.rolId!, rol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.obtenerRoles();
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Rol actualizado exitosamente' });
          this.changeDetector?.detectChanges();
        },
        error: (error) => {
          console.error('Error actualizando rol:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.mensaje || 'Error al actualizar rol' });
          this.changeDetector?.detectChanges();
        }
      });
  }

  eliminarRol(rol: Rol, onConfirm: () => void): void {
    this.rolService.eliminarRol(rol.rolId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.obtenerRoles();
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado exitosamente' });
          onConfirm();
          this.changeDetector?.detectChanges();
        },
        error: (error) => {
          console.error('Error eliminando rol:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.mensaje || 'Error al eliminar rol' });
          this.changeDetector?.detectChanges();
        }
      });
  }
}
