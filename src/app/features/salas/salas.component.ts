import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-salas',
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, DividerModule, IconFieldModule, InputIconModule],
  templateUrl: './salas.component.html',
  styleUrl: './salas.component.css'
})
export class SalasComponent {
  salaDialog = false;
  salaForm: Record<string, any> = {};
  searchSala = '';

  get salas() { return this.data.salas; }

  get filteredSalas() {
    const term = this.searchSala.toLowerCase();
    if (!term) return this.salas;
    return this.salas.filter(s =>
      s.nombreSala.toLowerCase().includes(term) ||
      s.codigoSala.toLowerCase().includes(term) ||
      (s.ubicacion ?? '').toLowerCase().includes(term)
    );
  }

  constructor(
    private data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  openSalaDialog(s?: any): void {
    this.salaForm = s ? { ...s } : {};
    this.salaDialog = true;
  }

  saveSala(): void {
    if (!this.salaForm['codigoSala'] || !this.salaForm['nombreSala']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Codigo y nombre son obligatorios' });
      return;
    }
    if (this.salaForm['salaId']) {
      const idx = this.salas.findIndex(s => s.salaId === this.salaForm['salaId']);
      if (idx >= 0) {
        this.salas[idx] = { ...this.salas[idx], ...this.salaForm };
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Sala actualizada' });
      }
    } else {
      this.salas.push({
        ...this.salaForm,
        salaId: this.data.nextId('sala'),
        activo: true
      } as any);
      this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Sala creada' });
    }
    this.salaDialog = false;
  }

  deleteSala(s: any): void {
    this.confirmationService.confirm({
      message: `Eliminar ${s.nombreSala}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.salas.indexOf(s);
        if (idx >= 0) this.salas.splice(idx, 1);
        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Sala eliminada' });
      }
    });
  }
}
