import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/Accesos/auth/auth.service';
import { ThemeService } from '../core/shared/services/theme.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NotificationComponent } from '../core/shared/components/notification/notification/notification.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ConfirmDialogModule, NotificationComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  title = 'MediCitas Pro';
  barraLateralColapsada = false;
  sidebarAbierta = false;

  constructor(public auth: AuthService, public tema: ThemeService) {}

  toggleSidebar(): void {
    this.sidebarAbierta = !this.sidebarAbierta;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 1200) {
      this.sidebarAbierta = false;
    }
  }

  tienePermiso(permiso: string): boolean {
    return this.auth.permisosService.tienePermiso(permiso);
  }

  get esAdmin(): boolean {
    return this.auth.esAdmin;
  }

  get esRecepcion(): boolean {
    return this.auth.esRecepcion;
  }

  get esDoctor(): boolean {
    return this.auth.esDoctor;
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  get estaAutenticado(): boolean {
    return this.auth.estaAutenticado();
  }

  get estaOscuro(): boolean {
    return this.tema.isDark();
  }

  get userName(): string {
    return this.auth.nombreUsuario || 'Usuario';
  }

  get userRole(): string {
    return this.auth.nombreRol || 'Sin rol';
  }

  get userInitials(): string {
    const name = this.userName || '';
    return name.charAt(0).toUpperCase() || 'U';
  }

  get userEmail(): string {
    return this.auth.correoUsuario || '';
  }

  cambiarTema(): void {
    this.tema.toggle();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
