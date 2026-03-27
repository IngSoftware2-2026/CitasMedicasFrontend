import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { switchMap, map, forkJoin, of, Observable, catchError } from 'rxjs';
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
import { SelectModule } from 'primeng/select';
import { Doctor, DoctorDetalle, DoctorEspecialidad } from '../../../core/models/Clinica/Doctores/doctor.model';
import { DoctoresService } from '../../../core/services/Clinica/doctores.service';
import { UsuarioService } from '../../../core/services/Accesos/usuarios/usuario.service';
import { EspecialidadesService } from '../../../core/services/Clinica/especialidades.service';
import { AuthService } from '../../../core/services/Accesos/auth//auth.service';
import { CloudinaryService } from '../../../core/services/Clinica/cloudinary.service';
import { Especialidad } from '../../../core/models/Catalogos/especialidad.model';
import { Usuario } from '../../../core/models/Accesos/usuario.model';
import { CloudinaryThumbPipe } from '../../../core/shared/pipes/cloudinary-thumb.pipe';
import { DoctorImagenUploadComponent } from '../../../core/shared/components/doctor-imagen-upload/doctor-imagen-upload.component';

@Component({
  selector: 'app-doctores',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, DialogModule, InputTextModule,
    TagModule, ToolbarModule, IconFieldModule, InputIconModule,
    CheckboxModule, ConfirmDialogModule, TooltipModule, SelectModule,
    CloudinaryThumbPipe, DoctorImagenUploadComponent
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

  // --- Creation: multiple specialties & schedules ---
  creationEspecialidades: { especialidadId: number; nombre: string; principal: boolean }[] = [];
  newCreationEspId: number | null = null;
  creationHorarios: any[] = [];
  editHorarios: any[] = [];
  newHorario: any = { diaSemana: 1, horaInicio: '08:00', horaFin: '17:00' };
  isHorarioLoading = false;

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
  private authService = inject(AuthService);
  private cloudinaryService = inject(CloudinaryService);
  private cdr = inject(ChangeDetectorRef);

  // Image upload for new doctor creation
  creationImagenFile: File | null = null;
  pendingImageFile: File | null = null;

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  get esSoloLectura(): boolean {
    return this.authService.esPaciente;
  }

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
        
        // Cargar horarios de cada doctor pasivamente
        this.doctoresList.forEach(doc => {
          this.doctoresService.listarHorarios(doc.medicoId).subscribe(horarios => {
            doc.horarios = horarios;
            this.cdr.detectChanges();
          });
        });

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

  /** Retorna opciones formateadas para el p-dropdown */
  getUsuariosDropdownOptions(): any[] {
    const usedUserIds = this.doctoresList.map((d: any) => d.usuarioId || d.UsuarioId);
    
    return this.getAllUsuarios().map(u => {
      const isLinked = usedUserIds.includes(u.usuarioId);
      const extraText = isLinked ? ' (Ya vinculado)' : '';
      return {
        label: `${u.nombreUsuario} — ${u.correo} (ID: ${u.usuarioId})${extraText}`,
        value: u.usuarioId
      };
    });
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
          
          // Cargar los horarios específicos de este doctor
          this.doctoresService.listarHorarios(det.medicoId).subscribe(horarios => {
            if (this.detailDoctor) this.detailDoctor.horarios = horarios;
            this.cdr.detectChanges();
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
    const doc = this.doctoresList.find(d => d.medicoId === medicoId);
    if (doc && doc.horarios && doc.horarios.length > 0) {
      const first = doc.horarios[0];
      const horaIni = first.horaInicio?.substring(0, 5) || first.horaInicio;
      const horaFin = first.horaFin?.substring(0, 5) || first.horaFin;
      return `${horaIni} - ${horaFin}`;
    }
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
        // Fetch horarios for detail
        this.doctoresService.listarHorarios(d.medicoId).subscribe(horarios => {
          if (this.detailDoctor) this.detailDoctor.horarios = horarios;
          this.cdr.detectChanges();
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
    this.creationHorarios = [];
    this.editHorarios = [];
    this.newHorario = { diaSemana: 1, horaInicio: '08:00', horaFin: '17:00' };
    this.creationImagenFile = null;
    this.pendingImageFile = null;

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

      this.doctoresService.listarHorarios(d.medicoId).subscribe({
        next: (horarios) => {
          this.editHorarios = horarios;
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
    // Start Cloudinary upload in parallel with the PUT if there's a pending image
    const upload$ = this.pendingImageFile
      ? this.cloudinaryService.uploadImagen(this.pendingImageFile).pipe(catchError(() => of(null as string | null)))
      : of(null as string | null);

    const edit$ = this.doctoresService.editar(this.doctorForm['medicoId'], this.doctorForm as Doctor);

    forkJoin({ upload: upload$, edit: edit$ }).subscribe({
      next: ({ upload }) => {
        const afterEdit = () => {
          // If we got a Cloudinary URL, PATCH the image on backend
          if (upload) {
            this.doctoresService.actualizarImagen(this.doctorForm['medicoId'], upload).subscribe({
              next: () => {
                const idx = this.doctoresList.findIndex(d => d.medicoId === this.doctorForm['medicoId']);
                if (idx !== -1) this.doctoresList[idx].imagen = upload;
              },
              error: () => this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Datos guardados pero no se pudo actualizar la imagen en el servidor' })
            });
          } else if (this.pendingImageFile) {
            this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Datos guardados pero no se pudo subir la imagen a Cloudinary' });
          }
          this.pendingImageFile = null;
          this.saving = false;
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Doctor actualizado correctamente' });
          this.cargarDoctores();
          this.doctorDialog = false;
        };

        const changedActivo = this.originalDoctor && this.originalDoctor.activo !== this.doctorForm['activo'];
        if (changedActivo) {
          this.doctoresService.cambiarActivo(this.doctorForm['medicoId']!, !!this.doctorForm['activo']).subscribe({
            next: () => afterEdit(),
            error: () => {
              this.saving = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Editó, pero falló al cambiar estado' });
              this.cargarDoctores();
              this.doctorDialog = false;
            }
          });
        } else {
          afterEdit();
        }
      },
      error: (err) => {
        this.saving = false;
        this.pendingImageFile = null;
        const errorMsg = err?.error?.mensaje || err?.error?.title || err?.message || 'No se pudo actualizar el doctor';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
      }
    });
  }

  private crearDoctor(): void {
    // Start Cloudinary upload immediately in parallel with the POST create
    const upload$: Observable<string | null> = this.creationImagenFile
      ? this.cloudinaryService.uploadImagen(this.creationImagenFile).pipe(catchError(() => of(null as string | null)))
      : of(null as string | null);

    const create$ = this.doctoresService.crear(this.doctorForm as Doctor);

    forkJoin({ upload: upload$, create: create$ }).subscribe({
      next: ({ upload, create }) => {
        console.log('[DoctoresComponent] Crear response:', create, '| Cloudinary URL:', upload);
        this._uploadedImageUrl = upload;
        const medId = create.medicoId;

        if (medId && medId > 0) {
          this.assignSpecialtiesAfterCreation(medId);
        } else {
          const usuarioIdToFind = Number(this.doctorForm['usuarioId']);
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

  private _uploadedImageUrl: string | null = null;

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

  /** Assign all selected specialties to the new doctor — in parallel with forkJoin */
  private assignSpecialtiesAfterCreation(medicoId: number): void {
    this._lastCreatedMedicoId = medicoId;
    const specs = [...this.creationEspecialidades];

    if (specs.length === 0) {
      this.finishCreation();
      return;
    }

    // Assign all specialties in parallel
    const assign$ = specs.map(spec =>
      this.doctoresService.asignarEspecialidad(medicoId, spec.especialidadId).pipe(
        catchError(err => {
          console.error(`[DoctoresComponent] Error asignando especialidad ${spec.especialidadId}:`, err);
          return of(null);
        })
      )
    );

    forkJoin(assign$).subscribe({
      next: () => {
        const principal = specs.find(s => s.principal);
        if (principal) {
          this.doctoresService.setEspecialidadPrincipal(medicoId, principal.especialidadId).subscribe({
            next: () => this.assignHorariosAfterCreation(medicoId),
            error: () => {
              this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Especialidades asignadas pero no se pudo marcar la principal' });
              this.assignHorariosAfterCreation(medicoId);
            }
          });
        } else {
          this.assignHorariosAfterCreation(medicoId);
        }
      },
      error: () => this.assignHorariosAfterCreation(medicoId)
    });
  }

  private assignHorariosAfterCreation(medicoId: number): void {
    const horarios = [...this.creationHorarios];

    if (horarios.length === 0) {
      this.finishCreation(false);
      return;
    }

    // Assign all horarios in parallel
    const assign$ = horarios.map(h => {
      h.medicoId = medicoId;
      return this.doctoresService.crearHorario(h).pipe(
        catchError(() => of(null))
      );
    });

    forkJoin(assign$).subscribe({
      next: (results) => {
        const hasError = results.some(r => r === null);
        this.finishCreation(hasError);
      },
      error: () => this.finishCreation(true)
    });
  }

  private finishCreation(hasHorarioError: boolean = false): void {
    const medicoId = this._lastCreatedMedicoId;
    const imageUrl = this._uploadedImageUrl;

    // Image was already uploaded to Cloudinary in parallel with POST create.
    // Now just PATCH the URL to the backend if we have one.
    if (imageUrl && medicoId > 0) {
      this.doctoresService.actualizarImagen(medicoId, imageUrl).subscribe({
        next: () => this.completeCreation(hasHorarioError),
        error: () => {
          this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Doctor creado pero no se pudo guardar la imagen en el servidor' });
          this.completeCreation(hasHorarioError);
        }
      });
    } else if (this.creationImagenFile && !imageUrl) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Doctor creado pero no se pudo subir la imagen a Cloudinary' });
      this.completeCreation(hasHorarioError);
    } else {
      this.completeCreation(hasHorarioError);
    }
  }

  private _lastCreatedMedicoId = 0;

  private completeCreation(hasHorarioError: boolean): void {
    this.saving = false;
    this._uploadedImageUrl = null;
    this.creationImagenFile = null;
    if (hasHorarioError) {
       this.messageService.add({ severity: 'warn', summary: 'Doctor Creado', detail: 'Doctor creado, pero ocurrió un error en el servidor al intentar guardar los horarios' });
    } else {
       this.messageService.add({ severity: 'success', summary: 'Doctor Creado', detail: `Doctor creado exitosamente con sus configuraciones` });
    }
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

  // ==================== HORARIOS MANAGEMENT (CREATE & EDIT MODES) ====================

  addCreationHorario(): void {
    if (!this.newHorario.horaInicio || !this.newHorario.horaFin) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Complete hora de inicio y fin' });
      return;
    }
    this.creationHorarios.push({ ...this.newHorario });
    this.newHorario.horaInicio = '08:00';
    this.newHorario.horaFin = '17:00';
  }

  removeCreationHorario(index: number): void {
    this.creationHorarios.splice(index, 1);
  }

  onEditImagenConfirmado(file: File): void {
    this.pendingImageFile = file;
  }

  onCreationImagenSubida(file: File): void {
    this.creationImagenFile = file;
  }

  addEditHorario(): void {
    if (!this.newHorario.horaInicio || !this.newHorario.horaFin) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Complete hora de inicio y fin' });
      return;
    }
    this.isHorarioLoading = true;
    const h = { ...this.newHorario, medicoId: this.doctorForm['medicoId'] };
    this.doctoresService.crearHorario(h).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Horario agregado exitosamente' });
        this.refreshHorarios();
        this.newHorario.horaInicio = '08:00';
        this.newHorario.horaFin = '17:00';
      },
      error: () => {
        this.isHorarioLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el horario' });
      }
    });
  }

  deleteEditHorario(h: any): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: '¿Está seguro de eliminar este horario?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isHorarioLoading = true;
        this.doctoresService.eliminarHorario(h.horarioId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Eliminado', detail: 'Horario eliminado' });
            this.refreshHorarios();
          },
          error: () => {
            this.isHorarioLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el horario' });
          }
        });
      }
    });
  }

  updateEditHorario(h: any): void {
    h.isEditing = false;
    this.isHorarioLoading = true;
    this.doctoresService.actualizarHorario(h).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Horario modificado' });
        this.refreshHorarios();
      },
      error: () => {
        this.isHorarioLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el horario' });
        this.refreshHorarios(); // Reset a la versión original
      }
    });
  }

  refreshHorarios() {
    this.doctoresService.listarHorarios(this.doctorForm['medicoId']).subscribe({
      next: (horarios) => {
        this.editHorarios = horarios;
        this.isHorarioLoading = false;
        
        // Update the card if present
        const index = this.doctoresList.findIndex(d => d.medicoId === this.doctorForm['medicoId']);
        if (index !== -1) {
          this.doctoresList[index].horarios = horarios;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isHorarioLoading = false;
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
