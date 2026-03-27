import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Component({
  selector: 'app-doctor-imagen-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-imagen-upload.component.html',
  styleUrl: './doctor-imagen-upload.component.css'
})
export class DoctorImagenUploadComponent {
  @Input() imagenActual: string | null = null;
  @Input() soloVista = false;
  @Input() nombreDoctor = '';
  @Output() archivoSeleccionado = new EventEmitter<File>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  previewUrl: string | null = null;
  errorMsg = '';

  get initials(): string {
    return (this.nombreDoctor || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('');
  }

  openFileSelector(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMsg = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMsg = 'Solo se permiten imágenes JPG, PNG o WebP';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.errorMsg = 'La imagen no debe superar 5 MB';
      return;
    }

    // createObjectURL is synchronous and instant — no FileReader needed
    this.previewUrl = URL.createObjectURL(file);
    this.archivoSeleccionado.emit(file);
  }

  quitarImagen(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.archivoSeleccionado.emit(undefined as any);
  }
}
