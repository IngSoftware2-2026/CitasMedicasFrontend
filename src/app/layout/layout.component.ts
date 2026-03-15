import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/Accesos/auth.service';
import { ThemeService } from '../core/shared/theme.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastModule, ConfirmDialogModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  title = 'MediCitas Pro';
  barraLateralColapsada = false;

  constructor(private auth: AuthService, public tema: ThemeService) {}

  tienePermiso(_permiso: string): boolean {
    return true;
  }

  get estaAutenticado(): boolean {
    return this.auth.estaAutenticado();
  }

  get estaOscuro(): boolean {
    return this.tema.estaOscuro();
  }

  cambiarTema(): void {
    this.tema.cambiar();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
