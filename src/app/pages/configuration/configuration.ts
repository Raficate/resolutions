import { Component, inject, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-configuration',
  imports: [TranslocoModule],
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
})
export class Configuration {
  translocoService = inject(TranslocoService);
  private themeService = inject(ThemeService);

  availableLangs = ['es', 'en'];
  activeLang = signal(this.translocoService.getActiveLang());
  
  themes: Theme[] = ['light', 'dark', 'system'];
  activeTheme = this.themeService.theme;

  changeLang(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.activeLang.set(lang);
    localStorage.setItem('preferredLang', lang);
  }

  changeTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  getLangLabel(lang: string): string {
    return this.translocoService.translate('languages.' + lang);
  }
}
