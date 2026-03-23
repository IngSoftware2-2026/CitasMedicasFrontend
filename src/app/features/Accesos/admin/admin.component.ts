import { Component } from '@angular/core';
import { AdminRolesComponent } from './admin-roles.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AdminRolesComponent],
  template: `
    <h2><i class="pi pi-shield"></i> Administración de Roles y Permisos</h2>
    <app-admin-roles />
  `,
  styles: []
})
export class AdminComponent {}
