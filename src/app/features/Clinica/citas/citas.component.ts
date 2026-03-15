import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { Cita } from '../../../core/models/Clinica/Citas/cita.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [FormsModule, DatePipe, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, DividerModule, IconFieldModule, InputIconModule],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent {
  searchCita = '';
  citaDialog = false;
  citaDetailDialog = false;
  citaForm: Record<string, any> = {};
  detailCita: Cita | null = null;

  get citas() { return this.data.citas; }
  get pacientes() { return this.data.pacientes; }
  get doctores() { return this.data.doctores; }
  get salas() { return this.data.salas; }
  get estadosCita() { return this.data.estadosCita; }
  get consultas() { return this.data.consultas; }

  get citasView() {
    const term = this.searchCita.toLowerCase();
    return this.citas.map(c => ({
      ...c,
      pacienteNombre: this.data.getPacienteNombre(c.pacienteId),
      doctorNombre: this.data.getDoctorNombre(c.medicoId),
      salaNombre: this.data.getSalaNombre(c.salaId),
      estadoNombre: this.data.getEstadoCitaNombre(c.estadoId),
      estadoCodigo: this.data.getEstadoCitaCodigo(c.estadoId)
    })).filter(c => !term ||
      c.pacienteNombre.toLowerCase().includes(term) ||
      c.doctorNombre.toLowerCase().includes(term) ||
      c.salaNombre.toLowerCase().includes(term) ||
      c.estadoNombre.toLowerCase().includes(term)
    );
  }

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  countByEstado(estadoId: number): number {
    return this.citas.filter(c => c.estadoId === estadoId).length;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  openCitaDialog(c?: any): void {
    if (c) {
      this.citaForm = { ...c, inicio: this.data.toDateTimeString(c.inicio) };
    } else {
      this.citaForm = { duracionMinutos: 30, estadoId: 1 };
    }
    this.citaDialog = true;
  }

  saveCita(): void {
    if (!this.citaForm['pacienteId'] || !this.citaForm['medicoId'] || !this.citaForm['salaId']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Paciente, doctor y sala son obligatorios' });
      return;
    }
    const inicio = new Date(this.citaForm['inicio']);
    const duracion = this.citaForm['duracionMinutos'] || 30;
    const fin = new Date(inicio.getTime() + duracion * 60000);

    if (this.citaForm['citaId']) {
      const idx = this.citas.findIndex(c => c.citaId === this.citaForm['citaId']);
      if (idx >= 0) {
        this.citas[idx] = { ...this.citas[idx], ...this.citaForm, inicio, fin, duracionMinutos: duracion };
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Cita actualizada' });
      }
    } else {
      this.citas.push({
        citaId: this.data.nextId('cita'),
        ...this.citaForm,
        inicio, fin, duracionMinutos: duracion,
        creadaPorUsuarioId: 1,
        fechaCreacion: new Date()
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Cita creada' });
    }
    this.citaDialog = false;
  }

  cambiarEstadoCita(c: any, nuevoEstado: number): void {
    const cita = this.citas.find(x => x.citaId === (c.citaId ?? c));
    if (cita) {
      cita.estadoId = nuevoEstado;
      this.messageService.add({ severity: 'success', summary: 'Estado', detail: `Cita ${this.data.getEstadoCitaNombre(nuevoEstado).toLowerCase()}` });
    }
  }

  openCitaDetail(c: any): void {
    this.detailCita = this.citas.find(x => x.citaId === c.citaId) ?? null;
    this.citaDetailDialog = true;
  }

  getConsultaDeCita(citaId: number) {
    return this.consultas.find(c => c.citaId === citaId) ?? null;
  }
}
