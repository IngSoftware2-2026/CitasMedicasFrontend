import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  title = 'MediCitas Pro';
  sidebarCollapsed = false;

  constructor(private auth: AuthService, public theme: ThemeService) {}

  can(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  get userName(): string {
    return this.auth.currentUser()?.nombreUsuario ?? '';
  }

  logout(): void {
    this.auth.logout();
  }
}
