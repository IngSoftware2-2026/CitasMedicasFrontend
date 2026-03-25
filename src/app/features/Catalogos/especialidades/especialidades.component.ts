import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EspecialidadesService } from '../../../core/services/Clinica/especialidades.service';
import { Especialidad } from '../../../core/models/Catalogos/especialidad.model';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [
    FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule,
    TagModule, ToolbarModule, TooltipModule, IconFieldModule, InputIconModule,
    CheckboxModule, ConfirmDialogModule
  ],
  templateUrl: './especialidades.component.html',
  styleUrl: './especialidades.component.css'
})
export class EspecialidadesComponent implements OnInit {
  // --- State ---
  searchEspecialidad = '';
  especialidadDialog = false;
  especialidadForm: Record<string, any> = {};
  formErrors: Record<string, string> = {};
  saving = false;
  loadingList = false;

  // --- Data ---
  especialidadesList: Especialidad[] = [];

  private especialidadesService = inject(EspecialidadesService);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.cargarEspecialidades();
  }

  // ==================== COMPUTED ====================

  get filteredEspecialidades(): Especialidad[] {
    const term = this.searchEspecialidad.toLowerCase();
    if (!term) return this.especialidadesList;
    return this.especialidadesList.filter(e => e.nombre.toLowerCase().includes(term));
  }

  countActivas(): number {
    return this.especialidadesList.filter(e => e.activo).length;
  }

  countInactivas(): number {
    return this.especialidadesList.filter(e => !e.activo).length;
  }

  // ==================== DATA LOADING ====================

  cargarEspecialidades(): void {
    this.loadingList = true;
    this.especialidadesService.listar().subscribe({
      next: (esps) => {
        this.especialidadesList = esps;
        this.loadingList = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingList = false;
        console.error('[EspecialidadesComponent] Error cargando especialidades:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las especialidades'
        });
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== DIALOG ====================

  openEspecialidadDialog(e?: any): void {
    this.formErrors = {};
    this.especialidadForm = e
      ? { ...e }
      : { nombre: '', activo: true };
    this.especialidadDialog = true;
  }

  // ==================== VALIDATION ====================

  private validateForm(): boolean {
    this.formErrors = {};
    let valid = true;

    if (!this.especialidadForm['nombre']?.trim()) {
      this.formErrors['nombre'] = 'El nombre de la especialidad es obligatorio';
      valid = false;
    }

    return valid;
  }

  // ==================== SAVE (CREATE / EDIT) ====================

  saveEspecialidad(): void {
    if (!this.validateForm()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Corrija los campos marcados en rojo'
      });
      return;
    }

    this.saving = true;

    if (this.especialidadForm['especialidadId']) {
      // —— EDITAR ——
      this.especialidadesService.editar(this.especialidadForm as Especialidad).subscribe({
        next: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizada',
            detail: `Especialidad "${this.especialidadForm['nombre']}" actualizada correctamente`
          });
          this.especialidadDialog = false;
          this.cargarEspecialidades();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.message || 'No se pudo actualizar la especialidad';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      });
    } else {
      // —— CREAR ——
      this.especialidadesService.insertar(this.especialidadForm as Especialidad).subscribe({
        next: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Creada',
            detail: `Especialidad "${this.especialidadForm['nombre']}" creada exitosamente`
          });
          this.especialidadDialog = false;
          this.cargarEspecialidades();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.message || 'No se pudo crear la especialidad';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      });
    }
  }

  // ==================== DELETE (DESACTIVAR) ====================

  deleteEspecialidad(e: any): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de desactivar la especialidad "${e.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.especialidadesService.desactivar(e.especialidadId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Desactivada',
              detail: `Especialidad "${e.nombre}" desactivada correctamente`
            });
            this.cargarEspecialidades();
          },
          error: (err) => {
            const msg = err?.message || 'No se pudo desactivar la especialidad';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          }
        });
      }
    });
  }
}
