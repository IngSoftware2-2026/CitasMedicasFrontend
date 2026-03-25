import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { AuthService } from '../../../core/services/Accesos/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, AvatarModule],
  templateUrl: './horarios.component.html',
  styleUrl: './horarios.component.css'
})
export class HorariosComponent {
  horarioDialog = false;
  horarioForm: Record<string, any> = {};

  diasSemana = [
    { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
    { label: 'Miercoles', value: 3 }, { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 }, { label: 'Sabado', value: 6 },
    { label: 'Domingo', value: 7 }
  ];

  get doctores() { return this.data.doctores; }

  get esSoloLectura(): boolean {
    return this.auth.esPaciente;
  }

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private auth: AuthService
  ) {}

  getDiaSemana(dia: number): string {
    return this.diasSemana.find(d => d.value === dia)?.label ?? '';
  }

  openHorarioDialog(h?: any): void {
    this.horarioForm = h ? { ...h } : { diaSemana: 1, horaInicio: '08:00', horaFin: '16:00' };
    this.horarioDialog = true;
  }

  saveHorario(): void {
    if (!this.horarioForm['medicoId']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Doctor es obligatorio' });
      return;
    }
    if (this.horarioForm['horarioId']) {
      const idx = this.data.horariosDoctor.findIndex(h => h.horarioId === this.horarioForm['horarioId']);
      if (idx >= 0) {
        this.data.horariosDoctor[idx] = { ...this.data.horariosDoctor[idx], ...this.horarioForm };
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Horario actualizado' });
      }
    } else {
      this.data.horariosDoctor.push({
        ...this.horarioForm,
        horarioId: this.data.nextId('horario'),
        activo: true
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Horario creado' });
    }
    this.horarioDialog = false;
  }

  deleteHorario(h: any): void {
    this.confirmationService.confirm({
      message: 'Eliminar este horario?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.data.horariosDoctor.indexOf(h);
        if (idx >= 0) this.data.horariosDoctor.splice(idx, 1);
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Horario eliminado' });
      }
    });
  }
}
