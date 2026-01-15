import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Injectable({ providedIn: 'root' })
export class AdService {
  private platformId = inject(PLATFORM_ID);
  private scriptLoaded = false;

  loadAdSense(clientId: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    if (this.scriptLoaded) return Promise.resolve();
    if (!clientId) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      // Avoid duplicate script
      const existing = document.querySelector<HTMLScriptElement>('script[data-adsbygoogle]')!;
      if (existing) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-adsbygoogle', 'true');
      script.onload = () => {
        this.scriptLoaded = true;
        // Ensure global array exists
        window.adsbygoogle = window.adsbygoogle || [];
        resolve();
      };
      script.onerror = () => reject(new Error('No se pudo cargar AdSense.'));
      document.head.appendChild(script);
    });
  }
}

