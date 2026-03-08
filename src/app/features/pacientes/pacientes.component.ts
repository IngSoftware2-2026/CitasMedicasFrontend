import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule, DatePipe, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, IconFieldModule, InputIconModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent {
  searchPaciente = '';
  pacienteDialog = false;
  pacienteForm: Record<string, any> = {};

  get pacientes() { return this.data.pacientes; }

  get filteredPacientes() {
    const term = this.searchPaciente.toLowerCase();
    if (!term) return this.pacientes;
    return this.pacientes.filter(p =>
      `${p.nombres} ${p.apellidos ?? ''}`.toLowerCase().includes(term) ||
      (p.telefono ?? '').toLowerCase().includes(term) ||
      (p.correo ?? '').toLowerCase().includes(term)
    );
  }

  countActivos(): number { return this.pacientes.filter(p => p.activo).length; }
  countInactivos(): number { return this.pacientes.filter(p => !p.activo).length; }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  openPacienteDialog(p?: any): void {
    this.pacienteForm = p ? { ...p, fechaNacimiento: p.fechaNacimiento ? this.data.toDateString(p.fechaNacimiento) : '' } : {};
    this.pacienteDialog = true;
  }

  savePaciente(): void {
    if (!this.pacienteForm['nombres'] || !this.pacienteForm['telefono']) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombres y telefono son obligatorios' });
      return;
    }
    if (this.pacienteForm['pacienteId']) {
      const idx = this.pacientes.findIndex(p => p.pacienteId === this.pacienteForm['pacienteId']);
      if (idx >= 0) {
        this.pacientes[idx] = { ...this.pacientes[idx], ...this.pacienteForm, fechaNacimiento: this.pacienteForm['fechaNacimiento'] ? new Date(this.pacienteForm['fechaNacimiento']) : undefined } as any;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Paciente actualizado' });
      }
    } else {
      this.pacientes.push({
        ...this.pacienteForm,
        pacienteId: this.data.nextId('paciente'),
        activo: true,
        fechaCreacion: new Date(),
        fechaNacimiento: this.pacienteForm['fechaNacimiento'] ? new Date(this.pacienteForm['fechaNacimiento']) : undefined
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Paciente creado' });
    }
    this.pacienteDialog = false;
  }

  togglePacienteActivo(p: any): void {
    p.activo = !p.activo;
    this.messageService.add({ severity: 'info', summary: 'Estado', detail: `Paciente ${p.activo ? 'activado' : 'desactivado'}` });
  }

  deletePaciente(p: any): void {
    this.confirmationService.confirm({
      message: `Eliminar a ${p.nombres} ${p.apellidos ?? ''}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.pacientes.indexOf(p);
        if (idx >= 0) this.pacientes.splice(idx, 1);
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Paciente eliminado' });
      }
    });
  }
}
