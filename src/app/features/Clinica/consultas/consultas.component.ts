import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, DividerModule, TextareaModule],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent {
  consultaDialog = false;
  consultaForm: Record<string, any> = {};

  get consultas() { return this.data.consultas; }
  get citas() { return this.data.citas; }

  constructor(public data: MockDataService, private messageService: MessageService) {}

  openConsultaDialog(c?: any): void {
    this.consultaForm = c ? { ...c } : {};
    this.consultaDialog = true;
  }

  saveConsulta(): void {
    if (!this.consultaForm['citaId']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Cita es obligatoria' });
      return;
    }
    if (this.consultaForm['consultaId']) {
      const idx = this.consultas.findIndex(c => c.consultaId === this.consultaForm['consultaId']);
      if (idx >= 0) {
        this.consultas[idx] = { ...this.consultas[idx], ...this.consultaForm };
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Consulta actualizada' });
      }
    } else {
      this.consultas.push({
        ...this.consultaForm,
        consultaId: this.data.nextId('consulta'),
        fecha: new Date()
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Consulta creada' });
    }
    this.consultaDialog = false;
  }
}
