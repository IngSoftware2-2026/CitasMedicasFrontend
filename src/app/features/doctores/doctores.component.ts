import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Doctor } from '../../core/models/Clinica/Doctores/doctor.model';

@Component({
  selector: 'app-doctores',
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, IconFieldModule, InputIconModule],
  templateUrl: './doctores.component.html',
  styleUrl: './doctores.component.css'
})
export class DoctoresComponent {
  searchDoctor = '';
  filterEspecialidad = '';
  doctorDialog = false;
  doctorDetailDialog = false;
  detailDoctor: Doctor | null = null;
  doctorForm: Record<string, any> = {};

  private colorClasses = ['color-indigo', 'color-teal', 'color-purple', 'color-blue', 'color-amber', 'color-red'];

  diasSemana = [
    { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
    { label: 'Miercoles', value: 3 }, { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 }, { label: 'Sabado', value: 6 },
    { label: 'Domingo', value: 7 }
  ];

  get doctores() { return this.data.doctores; }
  get salas() { return this.data.salas; }
  get especialidades() { return this.data.especialidades; }

  get filteredDoctores(): Doctor[] {
    const term = this.searchDoctor.toLowerCase();
    return this.doctores.filter(d => {
      const esp = this.data.getDoctorEspecialidad(d.medicoId).toLowerCase();
      const matchSearch = !term || d.nombrePublico.toLowerCase().includes(term) || esp.includes(term);
      const matchEsp = !this.filterEspecialidad || esp === this.filterEspecialidad.toLowerCase();
      return matchSearch && matchEsp;
    });
  }

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getColorClass(id: number): string {
    return this.colorClasses[id % this.colorClasses.length];
  }

  getCitasCount(medicoId: number): number {
    return this.data.citas.filter(c => c.medicoId === medicoId).length;
  }

  getRating(medicoId: number): string {
    const seed = (medicoId * 7 + 3) % 10;
    return (4.0 + seed / 10).toFixed(1);
  }

  getHorarioResumen(medicoId: number): string {
    const horarios = this.data.getHorariosDeDoctor(medicoId);
    if (horarios.length === 0) return 'Sin horario';
    const first = horarios[0];
    return `${first.horaInicio} - ${first.horaFin}`;
  }

  getDiaSemana(dia: number): string {
    return this.diasSemana.find(d => d.value === dia)?.label ?? '';
  }

  openDoctorDetail(d: Doctor): void {
    this.detailDoctor = d;
    this.doctorDetailDialog = true;
  }

  openDoctorDialog(d?: any): void {
    this.doctorForm = d ? { ...d } : { duracionDefaultMinutos: 30, duracionIntervaloMinutos: 10, minutosBuffer: 0 };
    this.doctorDialog = true;
  }

  saveDoctor(): void {
    if (!this.doctorForm['nombrePublico']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Nombre publico es obligatorio' });
      return;
    }
    if (this.doctorForm['medicoId']) {
      const idx = this.doctores.findIndex(d => d.medicoId === this.doctorForm['medicoId']);
      if (idx >= 0) {
        this.doctores[idx] = { ...this.doctores[idx], ...this.doctorForm };
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Doctor actualizado' });
      }
    } else {
      this.doctores.push({
        ...this.doctorForm,
        medicoId: this.data.nextId('doctor'),
        usuarioId: 99,
        activo: true
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Doctor creado' });
    }
    this.doctorDialog = false;
  }

  deleteDoctor(d: any): void {
    this.confirmationService.confirm({
      message: `Eliminar a ${d.nombrePublico}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.doctores.indexOf(d);
        if (idx >= 0) this.doctores.splice(idx, 1);
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Doctor eliminado' });
      }
    });
  }
}
