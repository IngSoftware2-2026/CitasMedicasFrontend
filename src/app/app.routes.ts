import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './features/Accesos/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PacientesComponent } from './features/Clinica/pacientes/pacientes.component';
import { DoctoresComponent } from './features/Clinica/doctores/doctores.component';
import { CitasComponent } from './features/Clinica/citas/citas.component';
import { SolicitudesComponent } from './features/Clinica/solicitudes/solicitudes.component';
import { SalasComponent } from './features/Catalogos/salas/salas.component';
import { EspecialidadesComponent } from './features/Catalogos/especialidades/especialidades.component';
import { ConsultasComponent } from './features/Clinica/consultas/consultas.component';
import { HorariosComponent } from './features/Clinica/horarios/horarios.component';
import { AdminComponent } from './features/Accesos/admin/admin.component';
import { UsuariosComponent } from './features/Accesos/usuarios/usuarios.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { PERMISSIONS } from './core/constants/permissions';

const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  PACIENTES: 'pacientes',
  DOCTORES: 'doctores',
  CITAS: 'citas',
  SOLICITUDES: 'solicitudes',
  SALAS: 'salas',
  ESPECIALIDADES: 'especialidades',
  CONSULTAS: 'consultas',
  HORARIOS: 'horarios',
  USUARIOS: 'usuarios',
  ADMIN: 'admin',
  EMPTY: ''
} as const;

export const routes: Routes = [
  { path: ROUTES.LOGIN, component: LoginComponent },
  {
    path: ROUTES.EMPTY,
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: ROUTES.DASHBOARD,
        component: DashboardComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.VER_DASHBOARD }
      },
      {
        path: ROUTES.PACIENTES,
        component: PacientesComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_PACIENTES }
      },
      {
        path: ROUTES.DOCTORES,
        component: DoctoresComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_DOCTORES }
      },
      {
        path: ROUTES.CITAS,
        component: CitasComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.VER_CITAS }
      },
      {
        path: ROUTES.SOLICITUDES,
        component: SolicitudesComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_SOLICITUDES }
      },
      {
        path: ROUTES.SALAS,
        component: SalasComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_CATALOGOS }
      },
      {
        path: ROUTES.ESPECIALIDADES,
        component: EspecialidadesComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_CATALOGOS }
      },
      {
        path: ROUTES.CONSULTAS,
        component: ConsultasComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.VER_CONSULTAS }
      },
      {
        path: ROUTES.HORARIOS,
        component: HorariosComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_CATALOGOS }
      },
      {
        path: ROUTES.USUARIOS,
        component: UsuariosComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_USUARIOS }
      },
      {
        path: ROUTES.ADMIN,
        component: AdminComponent,
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.GESTIONAR_ROLES }
      },
      { path: ROUTES.EMPTY, redirectTo: ROUTES.DASHBOARD, pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: ROUTES.LOGIN }
];
