import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { AdBanner } from './components/ad-banner/ad-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Sidebar, AdBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('resolutions');
}
