import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(this.cargarPreferencia());

  constructor() {
    effect(() => {
      const oscuro = this.isDark();
      document.documentElement.classList.toggle('dark-mode', oscuro);
      localStorage.setItem('medicitas-theme', oscuro ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(valor => !valor);
  }

  private cargarPreferencia(): boolean {
    const guardado = localStorage.getItem('medicitas-theme');
    if (guardado) return guardado === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
