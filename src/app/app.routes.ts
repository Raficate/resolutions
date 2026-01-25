import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Calendar } from './pages/calendar/calendar';
import { Tasks } from './pages/tasks/tasks';
import { Configuration } from './pages/configuration/configuration';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'calendar', component: Calendar },
  { path: 'tasks', component: Tasks },
  { path: 'settings', component: Configuration },
  { path: '**', redirectTo: '' }
];
