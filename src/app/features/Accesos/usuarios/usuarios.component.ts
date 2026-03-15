import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
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
  providers: [MessageService, ConfirmationService, UsuariosCrud, UsuariosUtils],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit, OnDestroy {
  searchUsuario = '';
  usuarioDialog = false;
  usuarioForm: Partial<Usuario> = {};
  isEditing = false;

  totalUsuarios = 0;
  activosCount = 0;
  inactivosCount = 0;
  adminCount = 0;
  filteredUsuariosList: Usuario[] = [];
  rolesList: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    public crud: UsuariosCrud,
    public utils: UsuariosUtils,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

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
    const usuarios = this.crud.usuarios;
    this.totalUsuarios = usuarios.length;
    this.activosCount = usuarios.filter(u => u.activo).length;
    this.inactivosCount = usuarios.filter(u => !u.activo).length;
    this.adminCount = usuarios.filter(u => u.rolId === 1).length;
    this.filteredUsuariosList = this.utils.filterUsuarios(this.searchUsuario, usuarios);
    this.rolesList = [...this.utils.roles];
  }

  onSearchChange(value: string): void {
    this.searchUsuario = value;
    this.updateCounts();
  }

  getInitials(name: string) { return this.utils.getInitials(name); }
  getRolAvatarColor(rolId: number) { return this.utils.getRolAvatarColor(rolId); }

  getRolNombre(rolId: number) { return this.utils.getRolNombre(rolId); }
  getRolCodigo(rolId: number) { return this.utils.getRolCodigo(rolId); }
  getRolSeverity(rolId: number) { return this.utils.getRolSeverity(rolId); }

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

  deleteUsuario(u: Usuario): void {
    this.confirmationService.confirm({
      message: `Eliminar el usuario ${u.nombreUsuario}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.crud.delete(u, () => {})
    });
  }
}
