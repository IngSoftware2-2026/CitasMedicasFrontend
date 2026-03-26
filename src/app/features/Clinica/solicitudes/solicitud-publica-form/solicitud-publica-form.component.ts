import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SolicitudesService } from '../../../../core/services/Clinica/solicitudes.service';
import { ErrorHandlerService } from '../../../../core/services/Http/error-handler.service';
import { DoctorPublicoDTO, SolicitudPublicaInsertarDTO } from '../../../../core/models/Clinica/Solicitudes/solicitud-publica.model';
import { NotificationComponent } from '../../../../core/shared/components/notification/notification/notification.component';

@Component({
  selector: 'app-solicitud-publica-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificationComponent],
  templateUrl: './solicitud-publica-form.component.html',
  styleUrl: './solicitud-publica-form.component.css'
})
export class SolicitudPublicaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private solicitudesService = inject(SolicitudesService);
  private errorHandler = inject(ErrorHandlerService);

  form!: FormGroup;
  doctores = signal<DoctorPublicoDTO[]>([]);
  loading = signal(false);
  loadingDoctores = signal(true);
  enviado = signal(false);
  telefonoEnviado = '';
  minDate = '';
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];

    this.form = this.fb.group({
      nombrePaciente: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-]{8,15}$/)]],
      email: ['', [Validators.email]],
      medicoId: [null, [Validators.required]],
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      motivo: ['', [Validators.maxLength(500)]]
    });

    this.cargarDoctores();
  }

  private cargarDoctores(): void {
    this.loadingDoctores.set(true);
    this.solicitudesService.listarDoctoresPublicos().subscribe({
      next: (res) => {
        const data = res?.data ?? (res as any)?.datos ?? [];
        const lista = Array.isArray(data) ? data : [];
        const normalizados = lista.map((d: any) => ({
          medicoId: d.medicoId ?? d.MedicoId,
          nombrePublico: d.nombrePublico ?? d.NombrePublico ?? '',
          nombreEspecialidad: d.nombreEspecialidad ?? d.NombreEspecialidad ?? '',
          duracionDefaultMinutos: d.duracionDefaultMinutos ?? d.DuracionDefaultMinutos ?? 30,
          salaPredeterminadaId: d.salaPredeterminadaId ?? d.SalaPredeterminadaId
        }));
        normalizados.sort((a: DoctorPublicoDTO, b: DoctorPublicoDTO) =>
          a.nombrePublico.localeCompare(b.nombrePublico)
        );
        this.doctores.set(normalizados);
        this.loadingDoctores.set(false);
      },
      error: () => {
        this.errorHandler.showError(500, 'No se pudieron cargar los doctores. Intenta más tarde.');
        this.loadingDoctores.set(false);
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const val = this.form.value;
    const fechaHoraInicio = new Date(`${val.fecha}T${val.hora}`).toISOString();

    const body: SolicitudPublicaInsertarDTO = {
      nombrePaciente: val.nombrePaciente.trim(),
      telefono: val.telefono.trim(),
      email: val.email?.trim() || undefined,
      medicoId: Number(val.medicoId),
      fechaHoraInicio,
      motivo: val.motivo?.trim() || undefined
    };

    this.solicitudesService.insertarPublica(body).subscribe({
      next: (res) => {
        const exitoso = res?.success ?? (res as any)?.exitoso;
        if (exitoso) {
          this.telefonoEnviado = body.telefono;
          this.enviado.set(true);
          this.form.reset();
        } else {
          const msg = res?.message ?? (res as any)?.mensaje ?? 'Error al enviar la solicitud';
          this.errorHandler.showError(400, msg);
        }
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error?.mensaje ?? 'Error al enviar la solicitud. Intenta nuevamente.';
        this.errorHandler.showError(500, msg);
        this.loading.set(false);
      }
    });
  }

  nuevaSolicitud(): void {
    this.enviado.set(false);
    this.telefonoEnviado = '';
  }
}
