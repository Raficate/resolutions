import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  user,
  User
} from '@angular/fire/auth';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private platformId = inject(PLATFORM_ID);

  user$: Observable<User | null>;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.user$ = user(this.auth);
      // Manejar el resultado del redirect cuando el usuario vuelve
      this.handleRedirectResult();
    } else {
      this.user$ = of(null);
    }
  }

  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        console.log('Usuario autenticado mediante redirect:', result.user.email);
      }
    } catch (error) {
      console.error('Error al procesar redirect de autenticación:', error);
    }
  }

  async login(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const provider = new GoogleAuthProvider();

    try {
      // Intentar con popup primero
      await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      // Si el popup falla (bloqueado, cerrado, etc.), usar redirect como fallback
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        console.log('Popup bloqueado o cerrado, usando redirect...');
        await signInWithRedirect(this.auth, provider);
      } else {
        // Re-lanzar otros errores
        throw error;
      }
    }
  }

  /**
   * Método alternativo que usa redirect directamente.
   * Útil para dispositivos móviles o navegadores que bloquean popups.
   */
  async loginWithRedirect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provider);
  }

  async logout(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await signOut(this.auth);
  }
}
