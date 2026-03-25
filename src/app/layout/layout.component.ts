import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/Accesos/auth.service';
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

  constructor(private auth: AuthService, public tema: ThemeService) {}

  toggleSidebar(): void {
    this.sidebarAbierta = !this.sidebarAbierta;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 1200) {
      this.sidebarAbierta = false;
    }
  }

  tienePermiso(_permiso: string): boolean {
    return true;
  }

  get estaAutenticado(): boolean {
    return this.auth.estaAutenticado();
  }

  get estaOscuro(): boolean {
    return this.tema.isDark();
  }

  get userName(): string {
    return localStorage.getItem('nombreUsuario') || 'admin3';
  }

  get userRole(): string {
    return localStorage.getItem('rolNombre') || 'Administrador';
  }

  get userInitials(): string {
    const name = this.userName;
    return name.charAt(0).toUpperCase();
  }

  get userEmail(): string {
    return localStorage.getItem('correo') || 'admin@medicitas.hn';
  }

  cambiarTema(): void {
    this.tema.toggle();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
