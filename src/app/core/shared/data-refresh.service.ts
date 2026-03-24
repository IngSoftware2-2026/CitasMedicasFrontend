import { Injectable, signal } from '@angular/core';

export type OperacionCRUD = 'create' | 'update' | 'delete';

@Injectable({ providedIn: 'root' })
export class DataRefreshService {
  private refreshTrigger = signal<number>(0);

  readonly pendientes = signal<number>(0);

  trigger(refrescar: boolean = true): void {
    this.refreshTrigger.update(v => v + 1);
    if (refrescar) {
      this.pendientes.update(v => v + 1);
    }
  }

  consume(): number {
    this.pendientes.update(v => Math.max(0, v - 1));
    return this.refreshTrigger();
  }

  subscribe(callback: () => void): () => void {
    const current = this.refreshTrigger();
    let previous = current;
    
    const interval = setInterval(() => {
      if (this.refreshTrigger() !== previous) {
        previous = this.refreshTrigger();
        callback();
      }
    }, 100);

    return () => clearInterval(interval);
  }
}

@Injectable({ providedIn: 'root' })
export class RefreshManager {
  private refreshCallbacks = new Map<string, () => void>();

  register(key: string, callback: () => void): void {
    this.refreshCallbacks.set(key, callback);
  }

  unregister(key: string): void {
    this.refreshCallbacks.delete(key);
  }

  refresh(key?: string): void {
    if (key) {
      const callback = this.refreshCallbacks.get(key);
      if (callback) callback();
    } else {
      this.refreshCallbacks.forEach(cb => cb());
    }
  }

  refreshAfterOperation(
    operation: OperacionCRUD,
    key: string,
    callback: () => void
  ): () => void {
    this.register(key, callback);
    return () => this.unregister(key);
  }
}
