import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { TranslocoHttpLoader } from './transloco-loader';

function getDefaultLang(): string {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('preferredLang');
  if (stored && ['es', 'en'].includes(stored)) return stored;
  const browserLang = navigator.language?.split('-')[0];
  return ['es', 'en'].includes(browserLang) ? browserLang : 'es';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: getDefaultLang(),
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader
    })
  ]
};
