import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DashboardUtils {
  private router = inject(Router);

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  navigateTo(route: string): void {
    this.router.navigate(['/' + route]);
  }
}
