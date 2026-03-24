import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { ConsultaService } from '../../../core/services/Clinica/consulta.service';
import { Consulta } from '../../../core/models/Clinica/Citas/consulta.model';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, DividerModule, TextareaModule],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent implements OnInit {
  consultaDialog = false;
  consultaForm: Record<string, any> = {};
  consultas = signal<Consulta[]>([]);


  get citas() { return this.data.citas; }

  constructor(
    public data: MockDataService,
    private consultaService: ConsultaService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.consultaService.obtenerConsultasPorId(2).subscribe({
      next: (data) => {
        this.consultas.set(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar pacientes - Status:', err.status);
        console.error('Error al listar pacientes - Body:', err.error);
        console.error('Error al listar pacientes - Headers:', err.headers);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes' });
        this.cdr.markForCheck();
      }
    });
  }

  openConsultaDialog(c?: any): void {
    this.consultaForm = c ? { ...c } : {};
    this.consultaDialog = true;
  }

  saveConsulta(): void {
    // if (!this.consultaForm['citaId']) {
    //   this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Cita es obligatoria' });
    //   return;
    // }
    // if (this.consultaForm['consultaId']) {
    //   const idx = this.consultas.findIndex(c => c.consultaId === this.consultaForm['consultaId']);
    //   if (idx >= 0) {
    //     this.consultas[idx] = { ...this.consultas[idx], ...this.consultaForm };
    //     this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Consulta actualizada' });
    //   }
    // } else {
    //   this.consultas.push({
    //     ...this.consultaForm,
    //     consultaId: this.data.nextId('consulta'),
    //     fecha: new Date()
    //   } as any);
    //   this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Consulta creada' });
    // }
    // this.consultaDialog = false;
  }
}
