import { Component, inject, signal, HostListener } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [AsyncPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private authService = inject(AuthService);

  user$ = this.authService.user$;
  menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.menuOpen.set(false);
    }
  }

  toggleMenu() {
    this.menuOpen.update(open => !open);
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.menuOpen.set(false);
    this.authService.logout();
  }
}
