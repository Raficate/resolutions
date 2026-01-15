import { Component, inject, PLATFORM_ID, Input, AfterViewInit, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AdService } from '../../services/ad.service';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [],
  templateUrl: './ad-banner.html',
  styleUrl: './ad-banner.scss',
})
export class AdBanner implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private elRef = inject(ElementRef<HTMLElement>);
  private adService = inject(AdService);
  isBrowser = isPlatformBrowser(this.platformId);
  environment = environment;
  adsenseClient: string = environment.adsenseClient ?? '';
  @Input() adSlot = ''; // Rellena con tu Slot ID cuando lo tengas
  @Input() nonPersonalized = false;

  async ngAfterViewInit() {
    if (!this.isBrowser) return;
    if (!this.adsenseClient) return;
    await this.adService.loadAdSense(this.adsenseClient);
    // Solicitar renderizado del anuncio si existe el <ins>
    // Opcional: NPA
    if (this.nonPersonalized && (window as any).adsbygoogle) {
      (window as any).adsbygoogle.requestNonPersonalizedAds = 1;
    }
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch {
      // ignora
    }
  }
}

