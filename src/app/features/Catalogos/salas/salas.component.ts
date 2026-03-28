import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sala } from '../../../core/models/Catalogos/sala.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CitasService } from '../../../core/services/Clinica/citas.service';
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
export class SalasComponent implements OnInit {
  salaDialog = false;
  salaForm: Record<string, any> = {};
  searchSala = '';
  salas: Sala[] = [];
  private nextSalaId = 1000;

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
    private citasService: CitasService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.citasService.listarSalas().subscribe({
      next: (resp) => {
        this.salas = resp.data ?? [];
        if (this.salas.length) {
          this.nextSalaId = Math.max(...this.salas.map(s => s.salaId)) + 1;
        }
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las salas' })
    });
  }

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
      const idx = this.salas.findIndex((s: Sala) => s.salaId === this.salaForm['salaId']);
      if (idx >= 0) {
        this.salas[idx] = { ...this.salas[idx], ...this.salaForm };
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Sala actualizada' });
      }
    } else {
      this.salas.push({
        ...this.salaForm,
        salaId: ++this.nextSalaId,
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
