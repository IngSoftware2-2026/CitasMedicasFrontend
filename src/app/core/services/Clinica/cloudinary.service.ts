import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private http = inject(HttpClient);
  private cloudName = environment.cloudinary.cloudName;
  private uploadPreset = environment.cloudinary.uploadPreset;
  private folder = environment.cloudinary.folder;

  uploadImagen(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', this.folder);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return this.http.post<any>(url, formData).pipe(
      map(response => response.secure_url as string)
    );
  }
}
