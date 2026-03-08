import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { PERMISSIONS } from './core/constants/permissions';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PacientesComponent } from './features/pacientes/pacientes.component';
import { DoctoresComponent } from './features/doctores/doctores.component';
import { CitasComponent } from './features/citas/citas.component';
import { SolicitudesComponent } from './features/solicitudes/solicitudes.component';
import { SalasComponent } from './features/salas/salas.component';
import { EspecialidadesComponent } from './features/especialidades/especialidades.component';
import { ConsultasComponent } from './features/consultas/consultas.component';
import { HorariosComponent } from './features/horarios/horarios.component';
import { AdminComponent } from './features/admin/admin.component';
import { UsuariosComponent } from './features/usuarios/usuarios.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.VER_DASHBOARD } },
      { path: 'pacientes', component: PacientesComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_PACIENTES } },
      { path: 'doctores', component: DoctoresComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_DOCTORES } },
      { path: 'citas', component: CitasComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.VER_CITAS } },
      { path: 'solicitudes', component: SolicitudesComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_SOLICITUDES } },
      { path: 'salas', component: SalasComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_CATALOGOS } },
      { path: 'especialidades', component: EspecialidadesComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_CATALOGOS } },
      { path: 'consultas', component: ConsultasComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.VER_CONSULTAS } },
      { path: 'horarios', component: HorariosComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_CATALOGOS } },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_USUARIOS } },
      { path: 'admin', component: AdminComponent, canActivate: [permissionGuard], data: { permission: PERMISSIONS.GESTIONAR_ROLES } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
