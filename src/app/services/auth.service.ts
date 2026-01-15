import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, signInWithPopup, signOut, GoogleAuthProvider, user, User } from '@angular/fire/auth';
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
    } else {
      this.user$ = of(null);
    }
  }

  async login(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async logout(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await signOut(this.auth);
  }
}
