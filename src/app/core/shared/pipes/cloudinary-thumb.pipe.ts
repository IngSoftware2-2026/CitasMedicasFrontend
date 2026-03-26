import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cloudinaryThumb', standalone: true })
export class CloudinaryThumbPipe implements PipeTransform {
  transform(url: string | null | undefined, width = 80, height = 80): string {
    if (!url) return '';
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`);
  }
}
