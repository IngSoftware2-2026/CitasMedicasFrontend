/**
 * ============================================================
 * Componente de Configuraciones
 * ============================================================
 * 
 * Descripción:
 * -----------
 * Panel de configuración de la cuenta del usuario actual.
 * Muestra información del perfil y permite cambiar el tema
 * de la aplicación (claro/oscuro).
 * 
 * Características:
 * - Visualización de datos del usuario
 * - Cambio de tema de la aplicación
 * - Iniciales del usuario para avatar
 * 
 * Datos del Usuario Mostrados:
 * --------------------------
 * - Nombre de usuario
 * - Correo electrónico
 * - Rol del usuario
 * - Iniciales para avatar
 * 
 * Servicios Utilizados:
 * -------------------
 * - AuthService: Datos del usuario autenticado
 * - ThemeService: Gestión del tema de la aplicación
 * - environment: Configuración del entorno
 */
import { Component } from '@angular/core';
import { ThemeService } from '../../../core/shared/services/theme.service';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.css'
})
export class ConfiguracionesComponent {
  /** URL base del API */
  apiUrl = environment.apiUrl;

  constructor(
    public tema: ThemeService,
    private auth: AuthService
  ) {}

  /** Obtiene el nombre del usuario autenticado */
  get nombreUsuario(): string {
    return this.auth.nombreUsuario || 'Usuario';
  }

  /** Obtiene el rol del usuario autenticado */
  get rolUsuario(): string {
    return this.auth.nombreRol || 'Sin rol';
  }

  /** Obtiene el correo del usuario autenticado */
  get correoUsuario(): string {
    return this.auth.correoUsuario || '';
  }

  /** Obtiene las iniciales del usuario para el avatar */
  get inicialesUsuario(): string {
    return this.nombreUsuario.charAt(0).toUpperCase();
  }

  /** Indica si el tema actual es oscuro */
  get esModoOscuro(): boolean {
    return this.tema.isDark();
  }

  /** Alterna entre tema claro y oscuro */
  toggleTema(): void {
    this.tema.toggle();
  }
}
