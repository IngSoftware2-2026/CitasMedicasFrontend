import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { ThemeService } from '../../../core/shared/services/theme.service';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { PacienteService } from '../../../core/services/Clinica/paciente.service';
import { ErrorHandlerService } from '../../../core/services/Http/error-handler.service';
import { Paciente } from '../../../core/models/Clinica/Pacientes/paciente.model';
import { environment } from '../../../../environments/environment';

interface PerfilPacienteForm {
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  numeroIdentidad: string;
}

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.css'
})
export class ConfiguracionesComponent implements OnInit {
  apiUrl = environment.apiUrl;

  private auth = inject(AuthService);
  private pacienteService = inject(PacienteService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);

  perfilPaciente: Paciente | null = null;
  perfilForm: PerfilPacienteForm = this.crearPerfilForm(null);
  cargandoPerfil = false;
  perfilInicializado = false;
  guardandoPerfil = false;

  constructor(public tema: ThemeService) {}

  ngOnInit(): void {
    if (this.esPaciente) {
      this.cargarPerfilPaciente();
    }
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  get nombreUsuario(): string {
    return this.auth.nombreUsuario || 'Usuario';
  }

  get rolUsuario(): string {
    return this.auth.nombreRol || 'Sin rol';
  }

  get correoUsuario(): string {
    return this.auth.correoUsuario || '';
  }

  get inicialesUsuario(): string {
    return this.nombreUsuario.charAt(0).toUpperCase();
  }

  get esModoOscuro(): boolean {
    return this.tema.isDark();
  }

  toggleTema(): void {
    this.tema.toggle();
  }

  cargarPerfilPaciente(): void {
    this.perfilInicializado = false;
    this.cargandoPerfil = true;
    this.pacienteService.obtenerPerfilActual().pipe(
      timeout(10000),
      catchError((error) => {
        const pacienteId = this.auth.pacienteIdActual();

        if (pacienteId && pacienteId > 0) {
          console.warn('[Configuraciones] PerfilActual fallo, usando fallback ObtenerPorId', {
            pacienteId,
            status: error?.status,
            message: error?.message
          });

          return this.pacienteService.obtenerPorId(pacienteId);
        }

        throw error;
      }),
      finalize(() => {
        this.cargandoPerfil = false;
        this.perfilInicializado = true;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (perfil) => {
        this.aplicarPerfilPaciente(perfil);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.perfilPaciente = null;
        this.perfilForm = this.crearPerfilForm(null);
        console.error('[Configuraciones] No se pudo cargar perfil', {
          status: error?.status,
          message: error?.message,
          body: error?.error
        });

        if (error?.status === 401) {
          this.errorHandler.showError(401, 'No se pudo validar tu sesion. Inicia sesion nuevamente.');
          return;
        }

        if (error?.status === 404) {
          return;
        }

        this.errorHandler.showError(error?.status || 500, 'No se pudo cargar el perfil del paciente');
        this.cdr.detectChanges();
      }
    });
  }

  guardarPerfilPaciente(): void {
    const fechaNacimiento = this.perfilForm.fechaNacimiento
      ? new Date(this.perfilForm.fechaNacimiento)
      : this.perfilPaciente?.fechaNacimiento;

    const payload: Partial<Paciente> = {
      pacienteId: this.perfilPaciente?.pacienteId,
      usuarioId: this.perfilPaciente?.usuarioId,
      nombres: this.perfilForm.nombres || this.perfilPaciente?.nombres || '',
      apellidos: this.perfilForm.apellidos || this.perfilPaciente?.apellidos || '',
      telefono: this.perfilForm.telefono || this.perfilPaciente?.telefono || '',
      correo: this.perfilForm.correo || this.perfilPaciente?.correo || '',
      fechaNacimiento,
      numeroIdentidad: this.perfilForm.numeroIdentidad || this.perfilPaciente?.numeroIdentidad || '',
      activo: this.perfilPaciente?.activo ?? true
    };

    if (!payload.nombres || !payload.apellidos || !payload.telefono || !payload.numeroIdentidad) {
      this.errorHandler.showWarning('Nombres, apellidos, telefono e identidad son obligatorios para completar perfil');
      return;
    }

    this.guardandoPerfil = true;
    const operation = this.perfilPaciente
      ? this.pacienteService.editar(payload)
      : this.pacienteService.completarPerfil(payload);

    operation.subscribe({
      next: () => {
        this.guardandoPerfil = false;
        this.errorHandler.showSuccess('Perfil actualizado correctamente');
        this.cargarPerfilPaciente();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.guardandoPerfil = false;
        this.errorHandler.showError(error?.status || 500, 'No se pudo guardar el perfil del paciente');
        this.cdr.detectChanges();
      }
    });
  }

  private crearPerfilForm(perfil: Paciente | null): PerfilPacienteForm {
    if (!perfil) {
      return {
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: this.correoUsuario || '',
        fechaNacimiento: '',
        numeroIdentidad: ''
      };
    }

    return {
      nombres: perfil.nombres || '',
      apellidos: perfil.apellidos || '',
      telefono: perfil.telefono || '',
      correo: perfil.correo || '',
      fechaNacimiento: this.formatearFechaNacimiento(perfil.fechaNacimiento),
      numeroIdentidad: perfil.numeroIdentidad || ''
    };
  }

  private aplicarPerfilPaciente(perfil: Paciente | null): void {
    this.perfilPaciente = perfil;

    if (perfil?.pacienteId) {
      this.auth.establecerPacienteId(perfil.pacienteId);
    }

    this.perfilForm = this.crearPerfilForm(perfil);
  }

  private formatearFechaNacimiento(fecha: Date | string | undefined): string {
    if (!fecha) {
      return '';
    }

    const fechaNormalizada = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(fechaNormalizada.getTime())) {
      return '';
    }

    return fechaNormalizada.toISOString().split('T')[0];
  }
}
