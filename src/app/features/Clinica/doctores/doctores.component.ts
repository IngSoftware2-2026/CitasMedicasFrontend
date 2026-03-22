import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { Doctor, DoctorDetalle, DoctorEspecialidad } from '../../../core/models/Clinica/Doctores/doctor.model';
import { DoctoresService } from '../../../core/services/Clinica/doctores.service';
import { UsuarioService } from '../../../core/services/Accesos/usuario.service';
import { EspecialidadesService } from '../../../core/services/Clinica/especialidades.service';
import { Especialidad } from '../../../core/models/Catalogos/especialidad.model';
import { Usuario } from '../../../core/models/Accesos/usuario.model';

@Component({
  selector: 'app-doctores',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, DialogModule, InputTextModule,
    TagModule, ToolbarModule, IconFieldModule, InputIconModule,
    CheckboxModule, ConfirmDialogModule, TooltipModule
  ],
  templateUrl: './doctores.component.html',
  styleUrl: './doctores.component.css'
})
export class DoctoresComponent implements OnInit {
  // --- Search & Filters ---
  searchDoctor = '';
  filterEspecialidadId: number | null = null;
  searchDoctorId: number | null = null;
  searchingById = false;

  // --- Dialogs ---
  doctorDialog = false;
  doctorDetailDialog = false;

  // --- Detail ---
  detailDoctor: DoctorDetalle | null = null;
  detailLoading = false;

  // --- Form ---
  doctorForm: Record<string, any> = {};
  originalDoctor: Doctor | null = null;
  activeTab = 'general';
  newEspecialidadId: number | null = null;
  saving = false;

  // --- Creation: multiple specialties ---
  creationEspecialidades: { especialidadId: number; nombre: string; principal: boolean }[] = [];
  newCreationEspId: number | null = null;

  // --- Validation errors ---
  formErrors: Record<string, string> = {};

  // --- List ---
  doctoresList: Doctor[] = [];
  loadingList = false;

  // --- Users for dropdown ---
  usuarios: Usuario[] = [];
  manualUsuarioEntry = false;  // Fallback to manual ID if dropdown is empty

  // --- Fallback to mock data for others, but fetch real salas ---
  salasList: any[] = [];
  especialidadesList: Especialidad[] = [];

  private colorClasses = ['color-indigo', 'color-teal', 'color-purple', 'color-blue', 'color-amber', 'color-rose'];

  diasSemana = [
    { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 }, { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 }, { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 7 }
  ];

  get doctores() { return this.doctoresList; }
  get salas() { return this.salasList; }
  get especialidades() { return this.especialidadesList; }

  get filteredDoctores(): Doctor[] {
    const term = (this.searchDoctor || '').toLowerCase();
    
    // Obtenemos el nombre exacto de la especialidad seleccionada para forzar el filtro local
    let filterEspName = '';
    if (this.filterEspecialidadId) {
       const esp = this.especialidades.find(e => e.especialidadId === this.filterEspecialidadId);
       if (esp) {
         filterEspName = esp.nombre.toLowerCase();
       }
    }

    return this.doctores.filter(d => {
      const nombre = d.nombrePublico || '';
      const espRaw = this.getDoctorEspecialidadDisplay(d);
      const esp = (espRaw || '').toLowerCase();
      
      const matchSearch = !term || nombre.toLowerCase().includes(term) || esp.includes(term);
      const matchSpecialtyDropdown = !filterEspName || esp.includes(filterEspName);
      
      return matchSearch && matchSpecialtyDropdown;
    });
  }

  private doctoresService = inject(DoctoresService);
  private usuarioService = inject(UsuarioService);
  private especialidadesService = inject(EspecialidadesService);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.cargarEspecialidades();
    this.cargarDoctores();
    this.cargarUsuarios();
    this.cargarSalas();
  }

  // ==================== DATA LOADING ====================

  cargarEspecialidades() {
    this.especialidadesService.listar().subscribe({
      next: (esps) => {
        // Solo mostrar especialidades activas en los dropdowns
        this.especialidadesList = esps.filter(e => e.activo);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[DoctoresComponent] Error cargando especialidades:', err);
        // Si falla el backend, fallback a MockData para no romper la UI
        this.especialidadesList = this.data.especialidades;
        this.cdr.detectChanges();
      }
    });
  }

  cargarDoctores() {
    this.loadingList = true;
    const espId = this.filterEspecialidadId || undefined;
    this.doctoresService.listar(undefined, espId).subscribe({
      next: (docs) => {
        this.doctoresList = docs;
        this.loadingList = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingList = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se cargaron los doctores' });
      }
    });
  }

  onFilterEspecialidad() {
    this.cargarDoctores();
  }

  cargarUsuarios() {
    console.log('[DoctoresComponent] Cargando usuarios...');
    this.usuarioService.listar().subscribe({
      next: (users) => {
        console.log('[DoctoresComponent] Usuarios recibidos:', users?.length, users);
        this.usuarios = users || [];
        // If no users available after filtering, switch to manual mode
        if (this.getAvailableUsuarios().length === 0 && this.usuarios.length > 0) {
          console.log('[DoctoresComponent] Todos los usuarios ya están vinculados a doctores');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[DoctoresComponent] Error cargando usuarios:', err);
        this.manualUsuarioEntry = true; // Fallback to manual entry
        this.cdr.detectChanges();
      }
    });
  }

  cargarSalas() {
    this.doctoresService.listarSalas().subscribe({
      next: (salas) => {
        this.salasList = salas || [];
        this.cdr.detectChanges();
      },
      error: () => console.error('[DoctoresComponent] Error al cargar salas reales')
    });
  }

  /** Returns ALL active users (for when all are linked) */
  getAllUsuarios(): Usuario[] {
    return this.usuarios.filter(u => u.activo);
  }

  /** Returns users NOT already linked to a doctor */
  getAvailableUsuarios(): Usuario[] {
    const usedUserIds = this.doctoresList.map((d: any) => d.usuarioId || d.UsuarioId);
    return this.usuarios.filter(u => u.activo && !usedUserIds.includes(u.usuarioId));
  }

  toggleManualEntry() {
    this.manualUsuarioEntry = !this.manualUsuarioEntry;
    if (!this.manualUsuarioEntry) {
      this.doctorForm['usuarioId'] = null;
    }
  }

  // ==================== SEARCH BY ID ====================

  buscarPorId() {
    if (!this.searchDoctorId || this.searchDoctorId <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'ID Inválido', detail: 'Ingrese un ID numérico mayor a 0' });
      return;
    }
    this.searchingById = true;
    this.doctoresService.obtenerPorId(this.searchDoctorId).subscribe({
      next: (det) => {
        this.searchingById = false;
        if (det) {
          this.detailDoctor = { ...det, especialidades: [] };
          this.doctorDetailDialog = true;
          this.detailLoading = true;
          // Cargar las especialidades específicas de este doctor tal como se hace en la card
          this.doctoresService.listarEspecialidades(det.medicoId).subscribe({
            next: (esps) => {
              this.detailLoading = false;
              if (this.detailDoctor) this.detailDoctor.especialidades = esps;
              this.cdr.detectChanges();
            },
            error: () => {
              this.detailLoading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.messageService.add({ severity: 'info', summary: 'No encontrado', detail: `No existe un doctor con ID ${this.searchDoctorId}` });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.searchingById = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar el doctor' });
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== HELPERS ====================

  getInitials(name: string): string {
    return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '';
  }

  getColorClass(id: number): string {
    return this.colorClasses[(id || 0) % this.colorClasses.length];
  }

  getCitasCount(medicoId: number): number {
    return this.data.citas.filter(c => c.medicoId === medicoId).length || 0;
  }

  getRating(medicoId: number): string {
    const seed = ((medicoId || 0) * 7 + 3) % 10;
    return (4.0 + seed / 10).toFixed(1);
  }

  getHorarioResumen(medicoId: number): string {
    const horarios = this.data.getHorariosDeDoctor(medicoId);
    if (!horarios || horarios.length === 0) return 'Sin horario';
    const first = horarios[0];
    return `${first.horaInicio} - ${first.horaFin}`;
  }

  getDiaSemana(dia: number): string {
    return this.diasSemana.find(d => d.value === dia)?.label ?? '';
  }

  getDoctorEspecialidadDisplay(d: any): string {
    if (d.nombreEspecialidad) return d.nombreEspecialidad;
    if (d.especialidadPrincipal) return d.especialidadPrincipal;
    return this.data.getDoctorEspecialidad(d.medicoId);
  }

  getDoctorSalaDisplay(d: any): string {
    if (d.nombreSala) return d.nombreSala;
    
    // Fallback para buscar el nombre en la lista de salas reales consultada al inicio
    if (d.salaPredeterminadaId && this.salasList && this.salasList.length > 0) {
      const realSala = this.salasList.find((s: any) => s.salaId === d.salaPredeterminadaId || s.SalaId === d.salaPredeterminadaId);
      if (realSala && (realSala.nombreSala || realSala.NombreSala)) {
        return realSala.nombreSala || realSala.NombreSala;
      }
    }

    // Fallback final para los mock logs antiguos
    const mockSala = this.data.getDoctorSala(d.medicoId);
    return mockSala ? mockSala : 'No asignada';
  }

  // ==================== DETAIL DIALOG ====================

  openDoctorDetail(d: Doctor): void {
    this.detailDoctor = { ...d, especialidades: [] } as DoctorDetalle;
    this.detailLoading = true;
    this.doctorDetailDialog = true;

    // Fetch doctor info + specialties in parallel
    this.doctoresService.obtenerPorId(d.medicoId).subscribe({
      next: (det) => {
        if (det) {
          this.detailDoctor = { ...det, especialidades: [] };
        }
        // Now fetch specialties from the new endpoint
        this.doctoresService.listarEspecialidades(d.medicoId).subscribe({
          next: (esps) => {
            this.detailLoading = false;
            if (this.detailDoctor) {
              this.detailDoctor.especialidades = esps;
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.detailLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.detailLoading = false;
        this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudieron cargar detalles completos' });
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== CREATE / EDIT DIALOG ====================

  openDoctorDialog(d?: any): void {
    this.originalDoctor = d || null;
    this.activeTab = 'general';
    this.newEspecialidadId = null;
    this.formErrors = {};
    this.creationEspecialidades = [];
    this.newCreationEspId = null;

    this.doctorForm = d ? { ...d } : {
      duracionDefaultMinutos: 30,
      duracionIntervaloMinutos: 10,
      minutosBuffer: 0,
      activo: true,
      usuarioId: null,
      salaPredeterminadaId: null
    };

    if (d && d.medicoId) {
      // Fetch specialties from the NEW dedicated endpoint
      this.doctoresService.listarEspecialidades(d.medicoId).subscribe({
        next: (esps) => {
          this.doctorForm['especialidades'] = esps;
          console.log('[DoctoresComponent] Especialidades cargadas para edici\u00f3n:', esps);
          this.cdr.detectChanges();
        },
        error: () => {
          this.doctorForm['especialidades'] = [];
          this.cdr.detectChanges();
        }
      });
    }

    this.doctorDialog = true;
  }

  // ==================== CREATION: MULTIPLE SPECIALTIES ====================

  addCreationEspecialidad(): void {
    if (!this.newCreationEspId) return;
    const esp = this.especialidades.find(e => e.especialidadId === this.newCreationEspId);
    if (!esp) return;

    // Check if already added
    if (this.creationEspecialidades.some(e => e.especialidadId === this.newCreationEspId)) {
      this.messageService.add({ severity: 'warn', summary: 'Duplicada', detail: 'Esta especialidad ya fue agregada' });
      return;
    }

    const isFirst = this.creationEspecialidades.length === 0;
    this.creationEspecialidades.push({
      especialidadId: esp.especialidadId,
      nombre: esp.nombre,
      principal: isFirst // First one is principal by default
    });
    this.newCreationEspId = null;
  }

  removeCreationEspecialidad(esp: { especialidadId: number; nombre: string; principal: boolean }): void {
    this.creationEspecialidades = this.creationEspecialidades.filter(e => e.especialidadId !== esp.especialidadId);
    // If we removed the principal and there are others, make the first one principal
    if (esp.principal && this.creationEspecialidades.length > 0) {
      this.creationEspecialidades[0].principal = true;
    }
  }

  setCreationPrincipal(esp: { especialidadId: number; nombre: string; principal: boolean }): void {
    this.creationEspecialidades.forEach(e => e.principal = false);
    esp.principal = true;
  }

  getAvailableCreationEspecialidades(): any[] {
    const addedIds = this.creationEspecialidades.map(e => e.especialidadId);
    return this.especialidades.filter(e => !addedIds.includes(e.especialidadId));
  }

  // ==================== VALIDATION ====================

  private validateForm(): boolean {
    this.formErrors = {};
    let valid = true;

    if (!this.doctorForm['nombrePublico']?.trim()) {
      this.formErrors['nombrePublico'] = 'El nombre público es obligatorio';
      valid = false;
    }

    if (this.doctorForm['usuarioId'] == null || this.doctorForm['usuarioId'] === '') {
      this.formErrors['usuarioId'] = 'El Usuario ID es obligatorio';
      valid = false;
    }

    const durDefault = Number(this.doctorForm['duracionDefaultMinutos']);
    if (!durDefault || durDefault <= 0) {
      this.formErrors['duracionDefaultMinutos'] = 'Debe ser mayor a 0';
      valid = false;
    }

    const durIntervalo = Number(this.doctorForm['duracionIntervaloMinutos']);
    if (!durIntervalo || durIntervalo <= 0) {
      this.formErrors['duracionIntervaloMinutos'] = 'Debe ser mayor a 0';
      valid = false;
    }

    // For NEW doctors: must have at least one specialty
    if (!this.doctorForm['medicoId'] && this.creationEspecialidades.length === 0) {
      this.formErrors['especialidades'] = 'Debe agregar al menos una especialidad';
      valid = false;
    }

    return valid;
  }

  // ==================== SAVE ====================

  saveDoctor(): void {
    if (!this.validateForm()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Corrija los campos marcados en rojo' });
      return;
    }

    this.saving = true;

    if (this.doctorForm['medicoId']) {
      this.editarDoctor();
    } else {
      this.crearDoctor();
    }
  }

  private editarDoctor(): void {
    this.doctoresService.editar(this.doctorForm['medicoId'], this.doctorForm as Doctor).subscribe({
      next: () => {
        const changedActivo = this.originalDoctor && this.originalDoctor.activo !== this.doctorForm['activo'];
        if (changedActivo) {
          this.doctoresService.cambiarActivo(this.doctorForm['medicoId']!, !!this.doctorForm['activo']).subscribe({
            next: () => {
              this.saving = false;
              this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Doctor y estado actualizados' });
              this.cargarDoctores();
              this.doctorDialog = false;
            },
            error: () => {
              this.saving = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Editó, pero falló al cambiar estado' });
              this.cargarDoctores();
              this.doctorDialog = false;
            }
          });
        } else {
          this.saving = false;
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Doctor actualizado correctamente' });
          this.cargarDoctores();
          this.doctorDialog = false;
        }
      },
      error: (err) => {
        this.saving = false;
        const errorMsg = err?.error?.mensaje || err?.error?.title || err?.message || 'No se pudo actualizar el doctor';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
      }
    });
  }

  private crearDoctor(): void {
    this.doctoresService.crear(this.doctorForm as Doctor).subscribe({
      next: (result) => {
        console.log('[DoctoresComponent] Crear response:', result);
        const medId = result.medicoId;

        if (medId && medId > 0) {
          // Backend returned the new MedicoId — assign specialties
          this.assignSpecialtiesAfterCreation(medId);
        } else {
          // Fallback: find by UsuarioId
          const usuarioIdToFind = Number(this.doctorForm['usuarioId']);
          console.log('[DoctoresComponent] No medicoId in response, searching by UsuarioId:', usuarioIdToFind);
          this.findNewDoctorAndAssignSpecialties(usuarioIdToFind);
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('[DoctoresComponent] Error creando doctor:', err);
        const errorMsg = err?.error?.mensaje || err?.error?.title || err?.message || 'No se pudo crear el doctor';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
      }
    });
  }

  /** Try all known response formats to extract the new MedicoId */
  private extractMedicoId(response: any): number | null {
    if (!response) return null;

    // Direct field
    if (response.medicoId) return response.medicoId;
    if (response.MedicoId) return response.MedicoId;
    if (response.id) return response.id;

    // Nested in datos/data
    const datos = response.datos || response.data;
    if (datos) {
      if (datos.medicoId) return datos.medicoId;
      if (datos.MedicoId) return datos.MedicoId;
      if (typeof datos === 'number') return datos;
    }

    return null;
  }

  /** Search for the newly created doctor by UsuarioId, then assign specialties */
  private findNewDoctorAndAssignSpecialties(usuarioId: number): void {
    this.doctoresService.listar().subscribe({
      next: (docs) => {
        // Find the doctor with this UsuarioId (there should be exactly one)
        const newDoc = docs.find((d: any) =>
          d.usuarioId === usuarioId || d.UsuarioId === usuarioId
        );

        if (newDoc && newDoc.medicoId) {
          console.log('[DoctoresComponent] Doctor encontrado por UsuarioId, MedicoId:', newDoc.medicoId);
          this.assignSpecialtiesAfterCreation(newDoc.medicoId);
        } else {
          // Couldn't find — just finish and tell user to assign manually
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Doctor creado. Abre el doctor para asignar especialidades manualmente.'
          });
          this.doctoresList = docs;
          this.doctorDialog = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Creado con aviso',
          detail: 'Doctor creado pero no se pudieron asignar las especialidades automáticamente.'
        });
        this.cargarDoctores();
        this.doctorDialog = false;
      }
    });
  }

  /** Assign all selected specialties to the new doctor sequentially */
  private assignSpecialtiesAfterCreation(medicoId: number): void {
    const specs = [...this.creationEspecialidades];

    if (specs.length === 0) {
      this.finishCreation();
      return;
    }

    let completed = 0;
    let hasError = false;

    const assignNext = () => {
      if (completed >= specs.length) {
        // All assigned! Now set the principal
        const principal = specs.find(s => s.principal);
        if (principal) {
          this.doctoresService.setEspecialidadPrincipal(medicoId, principal.especialidadId).subscribe({
            next: () => this.finishCreation(),
            error: () => {
              this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Especialidades asignadas pero no se pudo marcar la principal' });
              this.finishCreation();
            }
          });
        } else {
          this.finishCreation();
        }
        return;
      }

      const spec = specs[completed];
      this.doctoresService.asignarEspecialidad(medicoId, spec.especialidadId).subscribe({
        next: () => {
          completed++;
          assignNext();
        },
        error: (err) => {
          console.error(`[DoctoresComponent] Error asignando especialidad ${spec.especialidadId}:`, err);
          hasError = true;
          completed++;
          assignNext(); // Continue with next, don't stop
        }
      });
    };

    assignNext();
  }

  private finishCreation(): void {
    this.saving = false;
    const count = this.creationEspecialidades.length;
    this.messageService.add({
      severity: 'success',
      summary: 'Doctor Creado',
      detail: `Doctor creado exitosamente con ${count} especialidad${count > 1 ? 'es' : ''}`
    });
    this.cargarDoctores();
    this.doctorDialog = false;
  }

  // ==================== SPECIALTY MANAGEMENT (EDIT MODE) ====================

  getEspecialidadNombre(id: number): string {
    const esp = this.especialidades.find(e => e.especialidadId === id);
    return esp ? esp.nombre : `ID ${id}`;
  }

  getAvailableEspecialidades(): any[] {
    const assignedIds = (this.doctorForm['especialidades'] || []).map((e: any) => e.especialidadId);
    return this.especialidades.filter(e => !assignedIds.includes(e.especialidadId));
  }

  addSpecialty(): void {
    if (!this.newEspecialidadId || !this.doctorForm['medicoId']) return;
    this.doctoresService.asignarEspecialidad(this.doctorForm['medicoId'], this.newEspecialidadId).subscribe({
      next: () => {
        const isFirst = (this.doctorForm['especialidades']?.length || 0) === 0;
        if (isFirst) {
          this.doctoresService.setEspecialidadPrincipal(this.doctorForm['medicoId'], this.newEspecialidadId!).subscribe(() => this.refreshSpecialties());
        } else {
          this.refreshSpecialties();
        }
        this.messageService.add({ severity: 'success', summary: 'Agregada', detail: 'Especialidad asignada con éxito' });
        this.newEspecialidadId = null;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar especialidad' })
    });
  }

  removeSpecialty(esp: any): void {
    if ((this.doctorForm['especialidades'] || []).length <= 1) {
      this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'El doctor debe tener al menos una especialidad' });
      return;
    }

    if (esp.principal) {
      this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'No puede eliminar la especialidad principal. Asigne otra como principal primero.' });
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de remover la especialidad "${esp.nombreEspecialidad || this.getEspecialidadNombre(esp.especialidadId)}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.doctoresService.removerEspecialidad(this.doctorForm['medicoId'], esp.especialidadId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Removida', detail: 'Especialidad desvinculada' });
            this.refreshSpecialties();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo remover' })
        });
      }
    });
  }

  setPrincipal(esp: any): void {
    this.doctoresService.setEspecialidadPrincipal(this.doctorForm['medicoId'], esp.especialidadId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Principal Actualizada', detail: 'Marcada como especialidad primaria' });
        this.refreshSpecialties();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar principal' })
    });
  }

  // ==================== TOGGLE ACTIVO ====================

  toggleActivoFromCard(d: Doctor, event: Event): void {
    event.stopPropagation();
    const newActivo = !d.activo;
    const accion = newActivo ? 'activar' : 'desactivar';

    this.confirmationService.confirm({
      header: `Confirmar ${accion}`,
      message: `¿Está seguro de ${accion} al doctor "${d.nombrePublico}"?`,
      icon: newActivo ? 'pi pi-check-circle' : 'pi pi-ban',
      acceptLabel: `Sí, ${accion}`,
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: newActivo ? 'p-button-success' : 'p-button-danger',
      accept: () => {
        this.doctoresService.cambiarActivo(d.medicoId, newActivo).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: newActivo ? 'Activado' : 'Desactivado',
              detail: `Doctor ${accion} correctamente`
            });
            this.cargarDoctores();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: `No se pudo ${accion} al doctor` })
        });
      }
    });
  }

  // ==================== PRIVATE ====================

  private refreshSpecialties() {
    this.doctoresService.listarEspecialidades(this.doctorForm['medicoId']).subscribe(esps => {
      this.doctorForm['especialidades'] = esps;
      
      // Sincronizar la card principal en tiempo real
      const index = this.doctoresList.findIndex(d => d.medicoId === this.doctorForm['medicoId']);
      if (index !== -1) {
        if (esps && esps.length > 0) {
          this.doctoresList[index].nombreEspecialidad = esps.map((e: any) => e.nombreEspecialidad).join(', ');
        } else {
          this.doctoresList[index].nombreEspecialidad = '';
        }
      }

      this.cdr.detectChanges();
    });
  }
}
