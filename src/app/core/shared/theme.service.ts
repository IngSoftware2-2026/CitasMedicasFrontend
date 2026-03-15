import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  estaOscuro = signal(this.cargarPreferencia());

  constructor() {
    effect(() => {
      const oscuro = this.estaOscuro();
      document.documentElement.classList.toggle('dark-mode', oscuro);
      localStorage.setItem('medicitas-theme', oscuro ? 'dark' : 'light');
    });
  }

  cambiar(): void {
    this.estaOscuro.update(valor => !valor);
  }

  private cargarPreferencia(): boolean {
    const guardado = localStorage.getItem('medicitas-theme');
    if (guardado) return guardado === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
