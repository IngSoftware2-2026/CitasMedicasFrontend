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
  @Output() archivoConfirmado = new EventEmitter<File>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  previewUrl: string | null = null;
  selectedFile: File | null = null;
  confirmed = false;
  errorMsg = '';
  successMsg = '';

  get initials(): string {
    return (this.nombreDoctor || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('');
  }

  openFileSelector(): void {
    this.confirmed = false;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMsg = '';
    this.successMsg = '';
    this.confirmed = false;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMsg = 'Solo se permiten imágenes JPG, PNG o WebP';
      input.value = '';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.errorMsg = 'La imagen no debe superar 5 MB';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => this.previewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  confirmar(): void {
    if (!this.selectedFile) return;
    this.confirmed = true;
    this.archivoConfirmado.emit(this.selectedFile);
    this.successMsg = 'Foto lista para guardar';
    setTimeout(() => this.successMsg = '', 3000);
  }

  cancelar(): void {
    this.previewUrl = null;
    this.selectedFile = null;
    this.confirmed = false;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }
}
