import { Component } from '@angular/core';
import { AdminRolesComponent } from './operaciones/admin-roles.component';
import { AdminPermisosComponent } from './operaciones/admin-permisos.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AdminRolesComponent, AdminPermisosComponent],
  template: `
    <h2><i class="pi pi-shield"></i> Administración de Roles y Permisos</h2>
    <app-admin-roles />
    <app-admin-permisos />
  `,
  styles: []
})
export class AdminComponent {}
