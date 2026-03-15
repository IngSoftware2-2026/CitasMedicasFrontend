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
  private loginOps = inject(LoginOperations);

  loginUser = 'admin2';
  loginPass = 'admin123';
  loginError = '';

  login(): void {
    if (!this.loginUser || !this.loginPass) {
      this.loginError = 'Ingrese usuario y contraseña';
      return;
    }

    const credentials: LoginRequest = {
      nombreUsuario: this.loginUser,
      clave: this.loginPass
    };

    this.loginError = '';
    this.loginOps.login(credentials, () => {
      this.loginError = 'Usuario o contraseña incorrectos';
    });
  }
}
