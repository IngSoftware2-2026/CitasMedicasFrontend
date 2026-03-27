import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, timeout } from 'rxjs/operators';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { DoctoresService } from '../../../core/services/Clinica/doctores.service';
import { Doctor } from '../../../core/models/Clinica/Doctores/doctor.model';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, AvatarModule],
  templateUrl: './horarios.component.html',
  styleUrl: './horarios.component.css'
})
export class HorariosComponent implements OnInit {
  private auth = inject(AuthService);
  private doctoresService = inject(DoctoresService);
  private cdr = inject(ChangeDetectorRef);

  horarioDialog = false;
  horarioForm: Record<string, any> = {};
  doctores: Doctor[] = [];
  horariosByDoctor: Record<number, any[]> = {};
  cargando = false;

  diasSemana = [
    { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
    { label: 'Miercoles', value: 3 }, { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 }, { label: 'Sabado', value: 6 },
    { label: 'Domingo', value: 7 }
  ];

  get esSoloLectura(): boolean {
    return this.auth.esPaciente;
  }

  get horariosPaciente() {
    return this.doctores
      .map(d => ({
        medicoId: d.medicoId,
        nombrePublico: d.nombrePublico,
        especialidad: d.nombreEspecialidad || 'Especialidad no disponible',
        horarios: this.horariosByDoctor[d.medicoId] ?? []
      }))
      .filter(d => d.horarios.length > 0);
  }

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.doctoresService.listar(true).pipe(
      timeout(10000),
      switchMap((docs) => {
        this.doctores = docs ?? [];

        if (this.doctores.length === 0) {
          this.horariosByDoctor = {};
          return of([]);
        }

        return forkJoin(
          this.doctores.map((doctor) =>
            this.doctoresService.listarHorarios(doctor.medicoId).pipe(
              map((horarios) => ({
                medicoId: doctor.medicoId,
                horarios: horarios ?? []
              })),
              catchError(() => of({
                medicoId: doctor.medicoId,
                horarios: []
              }))
            )
          )
        );
      }),
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (resultados) => {
        const horariosMap: Record<number, any[]> = {};
        for (const resultado of resultados) {
          horariosMap[resultado.medicoId] = resultado.horarios;
        }
        this.horariosByDoctor = horariosMap;
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctores = [];
        this.horariosByDoctor = {};
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los doctores' });
        this.cdr.detectChanges();
      }
    });
  }

  getHorariosDeDoctor(medicoId: number): any[] {
    return this.horariosByDoctor[medicoId] ?? [];
  }

  getEspecialidadDoctor(medicoId: number): string {
    return this.doctores.find(d => d.medicoId === medicoId)?.nombreEspecialidad || 'Especialidad no disponible';
  }

  getDiaSemana(dia: number): string {
    return this.diasSemana.find(d => d.value === dia)?.label ?? '';
  }

  openHorarioDialog(h?: any): void {
    this.horarioForm = h
      ? {
          horarioId: h.horarioId,
          medicoId: h.medicoId ?? h.doctorId,
          diaSemana: h.diaSemana,
          horaInicio: (h.horaInicio || '').substring(0, 5),
          horaFin: (h.horaFin || '').substring(0, 5),
          activo: h.activo ?? true
        }
      : { diaSemana: 1, horaInicio: '08:00', horaFin: '16:00', medicoId: null, activo: true };
    this.horarioDialog = true;
  }

  saveHorario(): void {
    if (!this.horarioForm['medicoId']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Doctor es obligatorio' });
      return;
    }

    const payload = {
      horarioId: this.horarioForm['horarioId'] || 0,
      medicoId: this.horarioForm['medicoId'],
      diaSemana: this.horarioForm['diaSemana'],
      horaInicio: this.horarioForm['horaInicio'],
      horaFin: this.horarioForm['horaFin'],
      activo: this.horarioForm['activo'] ?? true
    };

    const request$ = payload.horarioId
      ? this.doctoresService.actualizarHorario(payload)
      : this.doctoresService.crearHorario(payload);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: payload.horarioId ? 'Actualizado' : 'Creado',
          detail: payload.horarioId ? 'Horario actualizado' : 'Horario creado'
        });
        this.horarioDialog = false;
        this.cargarDatos();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: payload.horarioId ? 'No se pudo actualizar el horario' : 'No se pudo crear el horario'
        });
      }
    });
  }

  deleteHorario(h: any): void {
    this.confirmationService.confirm({
      message: 'Eliminar este horario?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.doctoresService.eliminarHorario(h.horarioId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Horario eliminado' });
            this.cargarDatos();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el horario' });
          }
        });
      }
    });
  }
}
