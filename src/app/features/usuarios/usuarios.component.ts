import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Usuario } from '../../core/models/Accesos/usuario.model';
import { Rol } from '../../core/models/Accesos/rol.model';
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

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, SelectModule, IconFieldModule, InputIconModule, PasswordModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent {
  searchUsuario = '';
  usuarioDialog = false;
  usuarioForm: Partial<Usuario> = {};
  isEditing = false;

  get usuarios() { return this.data.usuarios; }
  get roles() { return this.data.roles; }

  constructor(
    public data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  countActivos(): number { return this.usuarios.filter(u => u.activo).length; }
  countInactivos(): number { return this.usuarios.filter(u => !u.activo).length; }
  countByRol(rolId: number): number { return this.usuarios.filter(u => u.rolId === rolId).length; }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  getRolAvatarColor(rolId: number): string {
    const codigo = this.getRolCodigo(rolId);
    switch (codigo) {
      case 'ADMIN': return '--red';
      case 'DOCTOR': return '--teal';
      case 'RECEP': return '--amber';
      case 'PACIENTE': return '--blue';
      default: return '--indigo';
    }
  }

  get filteredUsuarios(): Usuario[] {
    const term = this.searchUsuario.toLowerCase();
    if (!term) return this.usuarios;
    return this.usuarios.filter(u =>
      u.nombreUsuario.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      this.getRolNombre(u.rolId).toLowerCase().includes(term)
    );
  }

  getRolNombre(rolId: number): string {
    return this.roles.find(r => r.rolId === rolId)?.nombreRol ?? 'Sin rol';
  }

  getRolCodigo(rolId: number): string {
    return this.roles.find(r => r.rolId === rolId)?.codigoRol ?? '';
  }

  getRolSeverity(rolId: number): 'danger' | 'info' | 'warn' | 'success' | 'secondary' {
    const codigo = this.getRolCodigo(rolId);
    switch (codigo) {
      case 'ADMIN': return 'danger';
      case 'DOCTOR': return 'info';
      case 'RECEP': return 'warn';
      case 'PACIENTE': return 'success';
      default: return 'secondary';
    }
  }

  openUsuarioDialog(u?: Usuario): void {
    this.isEditing = !!u;
    this.usuarioForm = u ? { ...u, clave: '' } : { activo: true, fechaCreacion: this.data.toDateString(new Date()) };
    this.usuarioDialog = true;
  }

  saveUsuario(): void {
    if (!this.usuarioForm.nombreUsuario || !this.usuarioForm.correo || !this.usuarioForm.rolId) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Nombre, correo y rol son obligatorios' });
      return;
    }
    if (!this.isEditing && !this.usuarioForm.clave) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'La contraseña es obligatoria para nuevos usuarios' });
      return;
    }
    if (this.usuarioForm.usuarioId) {
      const idx = this.usuarios.findIndex(u => u.usuarioId === this.usuarioForm.usuarioId);
      if (idx >= 0) {
        const existing = this.usuarios[idx];
        const updated = { ...existing, ...this.usuarioForm } as Usuario;
        if (!this.usuarioForm.clave) {
          updated.clave = existing.clave;
        }
        this.usuarios[idx] = updated;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado' });
      }
    } else {
      this.usuarios.push({
        usuarioId: this.data.nextId('usuario'),
        nombreUsuario: this.usuarioForm.nombreUsuario,
        correo: this.usuarioForm.correo,
        telefono: this.usuarioForm.telefono,
        rolId: this.usuarioForm.rolId,
        activo: this.usuarioForm.activo ?? true,
        fechaCreacion: this.usuarioForm.fechaCreacion ?? this.data.toDateString(new Date())
      });
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Usuario creado' });
    }
    this.usuarioDialog = false;
  }

  toggleUsuarioActivo(u: Usuario): void {
    u.activo = !u.activo;
    this.messageService.add({ severity: 'info', summary: u.activo ? 'Activado' : 'Desactivado', detail: `${u.nombreUsuario} ${u.activo ? 'activado' : 'desactivado'}` });
  }

  deleteUsuario(u: Usuario): void {
    this.confirmationService.confirm({
      message: `Eliminar el usuario ${u.nombreUsuario}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.usuarios.indexOf(u);
        if (idx >= 0) this.usuarios.splice(idx, 1);
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado' });
      }
    });
  }
}
