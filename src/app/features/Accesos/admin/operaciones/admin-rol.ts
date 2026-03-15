import { Injectable, inject, ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { RolService } from '../../../../core/services/Accesos/rol.service';
import { Rol } from '../../../../core/models/Accesos/rol.model';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';

@Injectable()
export class AdminRolOperations {
  private rolService = inject(RolService);
  private messageService = inject(MessageService);
  private cdr: ChangeDetectorRef | null = null;
  
  private destroy$ = new Subject<void>();
  private rolesSubject = new BehaviorSubject<any[]>([]);
  roles$ = this.rolesSubject.asObservable();

  private rolPermisosSubject = new BehaviorSubject<any[]>([]);
  rolPermisos$ = this.rolPermisosSubject.asObservable();

  constructor() {
    setTimeout(() => this.loadRoles(), 0);
  }

  setCdr(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  private loadRoles(): void {
    console.log('Cargando roles...');
    this.rolService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Roles cargados:', data);
          this.rolesSubject.next(data || []);
          this.cdr?.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando roles:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar roles' });
          this.rolesSubject.next([]);
          this.cdr?.markForCheck();
        }
      });
  }

  get roles(): Rol[] {
    return this.rolesSubject.getValue();
  }

  get rolPermisos(): any[] {
    return this.rolPermisosSubject.getValue();
  }

  save(r: Partial<Rol>, isEdit: boolean): void {
    if (!r.codigoRol || !r.nombreRol) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Codigo y nombre son obligatorios' });
      return;
    }

    if (isEdit && r.rolId) {
      this.rolService.actualizarRol(r.rolId, r)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadRoles();
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Rol actualizado' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar rol' })
        });
    } else {
      this.rolService.insertar(r)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadRoles();
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Rol creado' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear rol' })
        });
    }
  }

  delete(r: Rol, onConfirm: () => void): void {
    this.rolService.eliminarRol(r.rolId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRoles();
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado' });
          onConfirm();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar rol' })
      });
  }
}
