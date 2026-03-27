/**

 * Gestiona el proceso de autenticación de usuarios en el sistema.
 * Permite a los usuarios iniciar sesión con su nombre de usuario
 * y contraseña.
 **/
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginRequest } from '../../../core/models/Accesos/usuario.model';
import { LoginOperations } from './operaciones';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  providers: [LoginOperations],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  /** Servicio de operaciones de login */
  private loginOperaciones = inject(LoginOperations);

  /** Nombre de usuario para login */
  nombreUsuario = 'admin2';
  
  /** Contraseña para login */
  contrasena = 'admin123';
  
  /** Mensaje de error de autenticación */
  mensajeError = '';
  
  /** Bandera para mostrar/ocultar contraseña */
  mostrarContrasena = false;

  /** Alterna la visibilidad de la contraseña */
  togglePassword(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  /** Procesa el inicio de sesión */
  login(): void {
    if (!this.nombreUsuario || !this.contrasena) {
      this.mensajeError = 'Ingrese usuario y contraseña';
      return;
    }

    const credenciales: LoginRequest = {
      nombreUsuario: this.nombreUsuario,
      clave: this.contrasena
    };

    this.mensajeError = '';
    this.loginOperaciones.login(credenciales, () => {
      this.mensajeError = 'Usuario o contraseña incorrectos';
    });
  }
}
