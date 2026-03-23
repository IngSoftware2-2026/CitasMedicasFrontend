import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
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
  selector: 'app-especialidades',
  standalone: true,
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, IconFieldModule, InputIconModule],
  templateUrl: './especialidades.component.html',
  styleUrl: './especialidades.component.css'
})
export class EspecialidadesComponent {
  searchEspecialidad = '';
  especialidadDialog = false;
  especialidadForm: Record<string, any> = {};

  get especialidades() { return this.data.especialidades; }

  get filteredEspecialidades() {
    const term = this.searchEspecialidad.toLowerCase();
    if (!term) return this.especialidades;
    return this.especialidades.filter(e => e.nombre.toLowerCase().includes(term));
  }

  countActivas(): number { return this.especialidades.filter(e => e.activo).length; }
  countInactivas(): number { return this.especialidades.filter(e => !e.activo).length; }

  constructor(
    private data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  openEspecialidadDialog(e?: any): void {
    this.especialidadForm = e ? { ...e } : {};
    this.especialidadDialog = true;
  }

  saveEspecialidad(): void {
    if (!this.especialidadForm['nombre']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Nombre es obligatorio' });
      return;
    }
    if (this.especialidadForm['especialidadId']) {
      const idx = this.especialidades.findIndex(e => e.especialidadId === this.especialidadForm['especialidadId']);
      if (idx >= 0) {
        this.especialidades[idx] = { ...this.especialidades[idx], ...this.especialidadForm };
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Especialidad actualizada' });
      }
    } else {
      this.especialidades.push({
        ...this.especialidadForm,
        especialidadId: this.data.nextId('especialidad'),
        activo: true
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Especialidad creada' });
    }
    this.especialidadDialog = false;
  }

  deleteEspecialidad(e: any): void {
    this.confirmationService.confirm({
      message: `Eliminar ${e.nombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.especialidades.indexOf(e);
        if (idx >= 0) this.especialidades.splice(idx, 1);
        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Especialidad eliminada' });
      }
    });
  }
}
