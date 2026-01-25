import { Injectable, inject, PLATFORM_ID, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  theme = signal<Theme>(this.getStoredTheme());

  constructor() {
    if (this.isBrowser) {
      // Aplicar tema inicial
      this.applyTheme(this.theme());

      // Escuchar cambios en preferencia del sistema
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme() === 'system') {
          this.applyTheme('system');
        }
      });

      // Reaccionar a cambios de tema
      effect(() => {
        this.applyTheme(this.theme());
        localStorage.setItem('theme', this.theme());
      });
    }
  }

  private getStoredTheme(): Theme {
    if (!this.isBrowser) return 'system';
    const stored = localStorage.getItem('theme') as Theme;
    return ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  }

  private applyTheme(theme: Theme) {
    if (!this.isBrowser) return;

    const root = document.documentElement;
    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    root.setAttribute('data-theme', effectiveTheme);
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
  }
}
