import { Component, OnInit, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule, DatePipe, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, IconFieldModule, InputIconModule, SelectModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PacientesComponent implements OnInit {
  searchPaciente = signal('');
  pacienteDialog = false;
  pacienteForm: Record<string, any> = {};
  pacientes = signal<Paciente[]>([]);
  todosUsuarios = signal<any[]>([]);
  usuariosDisponibles = signal<{ label: string; value: number }[]>([]);
  private http = inject(HttpClient);

  filteredPacientes = computed(() => {
    const term = this.searchPaciente().toLowerCase();
    const list = this.pacientes();
    if (!term) return list;
    return list.filter(p =>
      `${p.nombres} ${p.apellidos ?? ''}`.toLowerCase().includes(term) ||
      (p.telefono ?? '').toLowerCase().includes(term) ||
      (p.correo ?? '').toLowerCase().includes(term)
    );
  });

  countActivos = computed(() => this.pacientes().filter(p => p.activo).length);
  countInactivos = computed(() => this.pacientes().filter(p => !p.activo).length);

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  constructor(
    private pacienteService: PacienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarTodosUsuarios();
  }

  private cargarTodosUsuarios(): void {
    this.http.get<any>('/Accesos/Usuarios/Listar').subscribe({
      next: (resp) => {
        console.log('Respuesta cruda usuarios:', resp);
        const datos = resp?.data ?? resp?.datos ?? resp;
        const lista = Array.isArray(datos) ? datos : [];
        console.log('Usuarios cargados:', lista.length);
        this.todosUsuarios.set(lista);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.todosUsuarios.set([]);
      }
    });
  }

  cargarPacientes(): void {
    this.pacienteService.listar().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar pacientes - Status:', err.status);
        console.error('Error al listar pacientes - Body:', err.error);
        console.error('Error al listar pacientes - Headers:', err.headers);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes' });
        this.cdr.markForCheck();
      }
    });
  }

  openPacienteDialog(p?: Paciente): void {
    this.pacienteForm = p
      ? { ...p, fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().split('T')[0] : '' }
      : {};
    this.buildUsuariosDropdown(p?.usuarioId);
    this.pacienteDialog = true;
  }

  private buildUsuariosDropdown(usuarioIdActual?: number): void {
    const usuarios = this.todosUsuarios();
    const idsOcupados = new Set(this.pacientes().map(p => p.usuarioId));

    const opciones = usuarios
      .filter(u => u.activo)
      .map(u => {
        const ocupado = idsOcupados.has(u.usuarioId) && u.usuarioId !== usuarioIdActual;
        const esActual = u.usuarioId === usuarioIdActual;
        let label = `#${u.usuarioId} — ${u.nombreUsuario} (${u.correo})`;
        if (esActual) label = `#${u.usuarioId} — ${u.nombreUsuario} (actual)`;
        else if (ocupado) label = `#${u.usuarioId} — ${u.nombreUsuario} [ya asignado]`;
        return { label, value: u.usuarioId, disabled: ocupado };
      });

    console.log('Opciones dropdown:', opciones);
    this.usuariosDisponibles.set(opciones);
  }

  savePaciente(): void {
    if (!this.pacienteForm['nombres'] || !this.pacienteForm['apellidos'] || !this.pacienteForm['telefono'] || !this.pacienteForm['numeroIdentidad']) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombres, apellidos, teléfono y número de identidad son obligatorios' });
      return;
    }
    if (!this.pacienteForm['usuarioId'] || this.pacienteForm['usuarioId'] <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'El Usuario ID es obligatorio y debe ser mayor que cero' });
      return;
    }

    const payload: any = {
      usuarioId: this.pacienteForm['usuarioId'],
      nombres: this.pacienteForm['nombres'],
      apellidos: this.pacienteForm['apellidos'],
      telefono: this.pacienteForm['telefono'],
      correo: this.pacienteForm['correo'] || null,
      fechaNacimiento: this.pacienteForm['fechaNacimiento'] || null,
      numeroIdentidad: this.pacienteForm['numeroIdentidad'],
      activo: this.pacienteForm['activo'] ?? true
    };

    if (this.pacienteForm['pacienteId']) {
      payload.pacienteId = this.pacienteForm['pacienteId'];
      console.log('Editando paciente:', payload);
      this.pacienteService.editar(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Paciente actualizado' });
          this.pacienteDialog = false;
          this.cargarPacientes();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al editar:', err);
          console.error('Error al editar - Body:', JSON.stringify(err.error));
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || err?.error?.message || 'No se pudo actualizar el paciente' });
        }
      });
    } else {
      console.log('Insertando paciente:', payload);
      this.pacienteService.insertar(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Paciente creado' });
          this.pacienteDialog = false;
          this.cargarPacientes();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          console.error('Error al crear - Body:', JSON.stringify(err.error));
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || err?.error?.message || 'No se pudo crear el paciente' });
        }
      });
    }
  }

  togglePacienteActivo(p: Paciente): void {
    const payload: any = {
      pacienteId: p.pacienteId,
      usuarioId: p.usuarioId,
      nombres: p.nombres,
      apellidos: p.apellidos,
      telefono: p.telefono,
      correo: p.correo || null,
      fechaNacimiento: p.fechaNacimiento || null,
      numeroIdentidad: p.numeroIdentidad,
      activo: !p.activo
    };
    console.log('togglePacienteActivo payload:', JSON.stringify(payload));
    this.pacienteService.editar(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Estado', detail: `Paciente ${payload.activo ? 'activado' : 'desactivado'}` });
        this.cargarPacientes();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error togglePacienteActivo - Status:', err.status);
        console.error('Error togglePacienteActivo - Body:', JSON.stringify(err.error));
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || err?.error?.message || 'No se pudo cambiar el estado' });
      }
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
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || 'No se pudo eliminar el paciente' });
          }
        });
      }
    });
  }
}
