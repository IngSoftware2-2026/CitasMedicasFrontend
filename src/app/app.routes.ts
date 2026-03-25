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
import { PermisosComponent } from './features/Catalogos/permisos/permisos.component';
import { ConsultasComponent } from './features/Clinica/consultas/consultas.component';
import { HorariosComponent } from './features/Clinica/horarios/horarios.component';
import { AdminComponent } from './features/Accesos/admin/admin.component';
import { UsuariosComponent } from './features/Accesos/usuarios/usuarios.component';
import { ConfiguracionesComponent } from './features/Accesos/configuraciones/configuraciones.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  PACIENTES: 'pacientes',
  DOCTORES: 'doctores',
  CITAS: 'citas',
  SOLICITUDES: 'solicitudes',
  SALAS: 'salas',
  ESPECIALIDADES: 'especialidades',
  PERMISOS: 'permisos',
  CONSULTAS: 'consultas',
  HORARIOS: 'horarios',
  USUARIOS: 'usuarios',
  ADMIN: 'admin',
  CONFIGURACIONES: 'configuraciones',
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
        data: { routeName: 'DASHBOARD' }
      },
      {
        path: ROUTES.PACIENTES,
        component: PacientesComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'PACIENTES' }
      },
      {
        path: ROUTES.DOCTORES,
        component: DoctoresComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'DOCTORES' }
      },
      {
        path: ROUTES.CITAS,
        component: CitasComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'CITAS' }
      },
      {
        path: ROUTES.SOLICITUDES,
        component: SolicitudesComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'SOLICITUDES' }
      },
      {
        path: ROUTES.SALAS,
        component: SalasComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'SALAS' }
      },
      {
        path: ROUTES.ESPECIALIDADES,
        component: EspecialidadesComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'ESPECIALIDADES' }
      },
      {
        path: ROUTES.PERMISOS,
        component: PermisosComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'PERMISOS' }
      },
      {
        path: ROUTES.CONSULTAS,
        component: ConsultasComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'CONSULTAS' }
      },
      {
        path: ROUTES.HORARIOS,
        component: HorariosComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'HORARIOS' }
      },
      {
        path: ROUTES.USUARIOS,
        component: UsuariosComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'USUARIOS' }
      },
      {
        path: ROUTES.ADMIN,
        component: AdminComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'ADMIN' }
      },
      {
        path: ROUTES.CONFIGURACIONES,
        component: ConfiguracionesComponent,
        canActivate: [permissionGuard],
        data: { routeName: 'CONFIGURACIONES' }
      },
      { path: ROUTES.EMPTY, redirectTo: ROUTES.DASHBOARD, pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: ROUTES.LOGIN }
];
