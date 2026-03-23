import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PacienteService } from '../../../core/services/Clinica/paciente.service';
import { Paciente } from '../../../core/models/Clinica/Pacientes/paciente.model';
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
export class PacientesComponent implements OnInit {
  searchPaciente = '';
  pacienteDialog = false;
  pacienteForm: Record<string, any> = {};
  pacientes: Paciente[] = [];

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
    private pacienteService: PacienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteService.listar().subscribe({
      next: (data) => this.pacientes = data,
      error: (err) => {
        console.error('Error al listar pacientes - Status:', err.status);
        console.error('Error al listar pacientes - Body:', err.error);
        console.error('Error al listar pacientes - Headers:', err.headers);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes' });
      }
    });
  }

  openPacienteDialog(p?: Paciente): void {
    this.pacienteForm = p
      ? { ...p, fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().split('T')[0] : '' }
      : {};
    this.pacienteDialog = true;
  }

  savePaciente(): void {
    if (!this.pacienteForm['nombres'] || !this.pacienteForm['telefono']) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombres y telefono son obligatorios' });
      return;
    }

    const payload: any = {
      nombres: this.pacienteForm['nombres'],
      apellidos: this.pacienteForm['apellidos'] || null,
      telefono: this.pacienteForm['telefono'],
      correo: this.pacienteForm['correo'] || null,
      fechaNacimiento: this.pacienteForm['fechaNacimiento'] || null,
      numeroIdentidad: this.pacienteForm['numeroIdentidad'] || null,
      activo: this.pacienteForm['activo'] ?? true
    };

    if (this.pacienteForm['pacienteId']) {
      payload.pacienteId = this.pacienteForm['pacienteId'];
      if (this.pacienteForm['usuarioId']) payload.usuarioId = this.pacienteForm['usuarioId'];
      console.log('Editando paciente:', payload);
      this.pacienteService.editar(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Paciente actualizado' });
          this.pacienteDialog = false;
          this.cargarPacientes();
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || 'No se pudo actualizar el paciente' });
        }
      });
    } else {
      console.log('Insertando paciente:', payload);
      this.pacienteService.insertar(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Paciente creado' });
          this.pacienteDialog = false;
          this.cargarPacientes();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || 'No se pudo crear el paciente' });
        }
      });
    }
  }

  togglePacienteActivo(p: Paciente): void {
    const updated = { ...p, activo: !p.activo };
    this.pacienteService.editar(updated).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Estado', detail: `Paciente ${updated.activo ? 'activado' : 'desactivado'}` });
        this.cargarPacientes();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado' })
    });
  }

  deletePaciente(p: Paciente): void {
    this.confirmationService.confirm({
      message: `Eliminar a ${p.nombres} ${p.apellidos ?? ''}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.pacienteService.eliminarpaciente(p.pacienteId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Paciente eliminado' });
            this.cargarPacientes();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el paciente' })
        });
      }
    });
  }
}
