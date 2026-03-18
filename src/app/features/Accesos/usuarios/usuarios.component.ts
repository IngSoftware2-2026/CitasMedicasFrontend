import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password';
import { Usuario } from '../../../core/models/Accesos/usuario.model';
import { UsuariosCrud, UsuariosUtils } from './operaciones';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, SelectModule, IconFieldModule, InputIconModule, PasswordModule],
  providers: [MessageService, UsuariosCrud, UsuariosUtils],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit, OnDestroy {
  searchUsuario = '';
  selectedRoleFilter: number | null = null;
  usuarioDialog = false;
  usuarioForm: Partial<Usuario> = {};
  isEditing = false;

  totalUsuarios = 0;
  activosCount = 0;
  inactivosCount = 0;
  adminCount = 0;
  filteredUsuariosList: Usuario[] = [];
  rolesList: any[] = [];

  roleFilterOptions = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: 1 },
    { label: 'Doctor', value: 2 },
    { label: 'Recepcion', value: 3 },
    { label: 'Paciente', value: 4 },
    { label: 'DEVELOPER', value: 5 }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    public crud: UsuariosCrud,
    public utils: UsuariosUtils,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {
    this.crud.setCdr(cdr);
  }

  get usuarios() { return this.crud.usuarios; }
  get roles() { return this.rolesList; }

  get filteredUsuarios() {
    return this.filteredUsuariosList;
  }

  ngOnInit(): void {
    this.crud.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.updateCounts();
        this.cdr.detectChanges();
      });

    this.utils.roles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(roles => {
        this.rolesList = roles;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateCounts(): void {
    let usuarios = this.crud.usuarios;
    
    if (this.selectedRoleFilter !== null) {
      usuarios = usuarios.filter(u => u.rolId === this.selectedRoleFilter);
    }
    
    if (this.searchUsuario) {
      const search = this.searchUsuario.toLowerCase();
      usuarios = usuarios.filter(u => 
        u.nombreUsuario?.toLowerCase().includes(search) ||
        u.correo?.toLowerCase().includes(search)
      );
    }
    
    this.totalUsuarios = this.crud.usuarios.length;
    this.activosCount = this.crud.usuarios.filter(u => u.activo).length;
    this.inactivosCount = this.crud.usuarios.filter(u => !u.activo).length;
    this.adminCount = this.crud.usuarios.filter(u => u.rolId === 1).length;
    this.filteredUsuariosList = usuarios;
    this.rolesList = [...this.utils.roles];
  }

  onSearchChange(value: string): void {
    this.searchUsuario = value;
    this.updateCounts();
  }

  onRoleFilterChange(value: number | null): void {
    this.selectedRoleFilter = value;
    this.updateCounts();
  }

  getInitials(name: string) { return this.utils.getInitials(name); }
  getRolAvatarColor(rolId: number, nombreUsuario?: string) { return this.utils.getRolAvatarColor(rolId, nombreUsuario); }

  getRolNombre(rolId: number) { return this.utils.getRolNombre(rolId); }
  getRolCodigo(rolId: number) { return this.utils.getRolCodigo(rolId); }
  getRolSeverity(rolId: number) { return this.utils.getRolSeverity(rolId); }
  getRolBadgeClass(rolId: number) { return this.utils.getRolBadgeClass(rolId); }

  openUsuarioDialog(u?: Usuario): void {
    this.isEditing = !!u;
    this.usuarioForm = u ? { ...u, clave: '' } : { activo: true };
    this.usuarioDialog = true;
  }

  saveUsuario(): void {
    this.crud.save(this.usuarioForm, this.isEditing);
    this.usuarioDialog = false;
  }

  toggleUsuarioActivo(u: Usuario): void {
    this.crud.toggle(u);
  }
}
