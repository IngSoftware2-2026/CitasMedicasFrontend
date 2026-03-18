import { Component } from '@angular/core';
import { ThemeService } from '../../../core/shared/theme.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.css'
})
export class ConfiguracionesComponent {
  apiUrl = environment.apiUrl;

  constructor(public tema: ThemeService) {}

  get userName(): string {
    return localStorage.getItem('nombreUsuario') || 'admin3';
  }

  get userRole(): string {
    return localStorage.getItem('rolNombre') || 'Administrador';
  }

  get userEmail(): string {
    return localStorage.getItem('correo') || 'admin@medicitas.hn';
  }

  get userInitials(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  get isDarkMode(): boolean {
    return this.tema.estaOscuro();
  }

  toggleTheme(): void {
    this.tema.cambiar();
  }
}
