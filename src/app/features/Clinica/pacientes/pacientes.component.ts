import { Component, OnInit, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { switchMap } from 'rxjs';
import { PacienteService } from '../../../core/services/Clinica/paciente.service';
import { UsuarioService } from '../../../core/services/Accesos/usuarios/usuario.service';
import { ErrorHandlerService } from '../../../core/services/Http/error-handler.service';
import { Paciente } from '../../../core/models/Clinica/Pacientes/paciente.model';
import { ConfirmationService } from 'primeng/api';
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
  styleUrl: './pacientes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PacientesComponent implements OnInit {
  searchPaciente = signal('');
  pacienteDialog = false;
  deleteDialog = false;
  pacienteToDelete: Paciente | null = null;
  pacienteForm: Record<string, any> = {};
  pacientes = signal<Paciente[]>([]);
  private usuarioService = inject(UsuarioService);
  private errorHandler = inject(ErrorHandlerService);

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
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteService.listar().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar pacientes:', err);
        const url = err?.url || '/Pacientes/Listar';
        this.errorHandler.showError(err?.status || 0, `Error al listar pacientes [${err?.status || '?'}] → ${url}`);
        this.cdr.markForCheck();
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
    if (!this.pacienteForm['nombres'] || !this.pacienteForm['apellidos'] || !this.pacienteForm['telefono'] || !this.pacienteForm['numeroIdentidad']) {
      this.errorHandler.showWarning('Nombres, apellidos, teléfono y número de identidad son obligatorios');
      return;
    }

    if (this.pacienteForm['pacienteId']) {
      // Editar paciente existente
      const payload: any = {
        pacienteId: this.pacienteForm['pacienteId'],
        usuarioId: this.pacienteForm['usuarioId'],
        nombres: this.pacienteForm['nombres'],
        apellidos: this.pacienteForm['apellidos'],
        telefono: this.pacienteForm['telefono'],
        correo: this.pacienteForm['correo'] || null,
        fechaNacimiento: this.pacienteForm['fechaNacimiento'] || null,
        numeroIdentidad: this.pacienteForm['numeroIdentidad'],
        activo: this.pacienteForm['activo'] ?? true
      };
      this.pacienteService.editar(payload).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Paciente actualizado correctamente');
          this.pacienteDialog = false;
          this.cargarPacientes();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al editar:', err);
          const url = err?.url || '/Pacientes/Editar';
          const msg = err?.error?.message || err?.error?.mensaje || err?.message || 'Error desconocido';
          this.errorHandler.showError(err?.status || 0, `${msg} [${err?.status || '?'}] → ${url}`);
        }
      });
    } else {
      // Crear usuario automáticamente y luego crear paciente
      const nombres = this.pacienteForm['nombres'].trim();
      const apellidos = this.pacienteForm['apellidos'].trim();
      const nombreUsuario = `${nombres.split(' ')[0]}.${apellidos.split(' ')[0]}`.toLowerCase();
      const nuevoUsuario = {
        nombreUsuario,
        correo: this.pacienteForm['correo'] || `${nombreUsuario}@medicitas.com`,
        telefono: this.pacienteForm['telefono'],
        clave: this.pacienteForm['numeroIdentidad'],
        rolId: 3
      };

      this.usuarioService.insertar(nuevoUsuario).pipe(
        switchMap(() => this.usuarioService.listar())
      ).subscribe({
        next: (usuarios) => {
          const usuarioCreado = usuarios.find((u: any) => u.nombreUsuario === nombreUsuario);
          if (!usuarioCreado || !usuarioCreado.usuarioId) {
            this.errorHandler.showError(0, 'Usuario creado pero no se pudo obtener su ID. Intente nuevamente.');
            return;
          }
          const payload: any = {
            usuarioId: usuarioCreado.usuarioId,
            nombres,
            apellidos,
            telefono: this.pacienteForm['telefono'],
            correo: this.pacienteForm['correo'] || null,
            fechaNacimiento: this.pacienteForm['fechaNacimiento'] || null,
            numeroIdentidad: this.pacienteForm['numeroIdentidad'],
            activo: true
          };
          this.pacienteService.insertar(payload).subscribe({
            next: () => {
              this.errorHandler.showSuccess('Paciente y usuario creados exitosamente');
              this.pacienteDialog = false;
              this.cargarPacientes();
              this.cdr.markForCheck();
            },
            error: (err) => {
              console.error('Error al crear paciente:', err);
              const url = err?.url || '/Pacientes/Insertar';
              const msg = err?.error?.message || err?.error?.mensaje || err?.message || 'Error desconocido';
              this.errorHandler.showError(err?.status || 0, `${msg} [${err?.status || '?'}] → ${url}`);
            }
          });
        },
        error: (err) => {
          console.error('Error al crear usuario:', err);
          const url = err?.url || '/Accesos/Usuarios/Insertar';
          const msg = err?.error?.message || err?.error?.mensaje || err?.message || 'Error al crear usuario';
          this.errorHandler.showError(err?.status || 0, `${msg} [${err?.status || '?'}] → ${url}`);
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
    this.pacienteService.editar(payload).subscribe({
      next: () => {
        this.errorHandler.showInfo(`Paciente ${payload.activo ? 'activado' : 'desactivado'}`);
        this.cargarPacientes();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error togglePacienteActivo:', err);
        const url = err?.url || '/Pacientes/Editar';
        const msg = err?.error?.message || err?.error?.mensaje || err?.message || 'Error desconocido';
        this.errorHandler.showError(err?.status || 0, `${msg} [${err?.status || '?'}] → ${url}`);
      }
    });
  }

  deletePaciente(p: Paciente): void {
    this.pacienteToDelete = p;
    this.deleteDialog = true;
  }

  confirmDelete(): void {
    if (!this.pacienteToDelete) return;
    const p = this.pacienteToDelete;
    this.pacienteService.eliminarpaciente(p.pacienteId).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Paciente eliminado correctamente');
        this.deleteDialog = false;
        this.pacienteToDelete = null;
        this.cargarPacientes();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        const url = err?.url || '/Pacientes/Eliminar';
        const msg = err?.error?.message || err?.error?.mensaje || err?.message || 'Error desconocido';
        this.errorHandler.showError(err?.status || 0, `${msg} [${err?.status || '?'}] → ${url}`);
      }
    });
  }
}
