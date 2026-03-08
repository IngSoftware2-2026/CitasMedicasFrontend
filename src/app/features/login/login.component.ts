import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  title = 'MediCitas Pro';
  loginUser = 'admin@medicitas.com';
  loginPass = 'admin123';
  loginError = '';
  showPassword = false;
  rememberSession = true;

  showForgotDialog = false;
  forgotEmail = '';
  forgotSuccess = false;

  showContactDialog = false;

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    if (this.auth.login(this.loginUser, this.loginPass)) {
      this.loginError = '';
      if (this.rememberSession) {
        localStorage.setItem('medicitas-remember', this.loginUser);
      } else {
        localStorage.removeItem('medicitas-remember');
      }
      this.router.navigate(['/dashboard']);
    } else {
      this.loginError = 'Credenciales inválidas o usuario inactivo';
    }
  }

  sendForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotSuccess = true;
    setTimeout(() => {
      this.forgotSuccess = false;
      this.showForgotDialog = false;
      this.forgotEmail = '';
    }, 3000);
  }
}
