/**
 * Componente para mostrar notificaciones en pantalla.
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlerService } from '../../../../services/Http/error-handler.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  errorHandler = inject(ErrorHandlerService);
}
