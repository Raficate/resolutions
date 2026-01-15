import { Component, inject, computed, signal } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ResolutionService, Resolution } from '../../services/resolution.service';
import { AuthService } from '../../services/auth.service';

interface GanttBar {
  resolution: Resolution;
  left: number;
  width: number;
  color: string;
}

@Component({
  selector: 'app-calendar',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class Calendar {
  private resolutionService = inject(ResolutionService);
  private authService = inject(AuthService);

  user$ = this.authService.user$;
  resolutions$ = this.resolutionService.getResolutions$();

  // Configuración del Gantt
  today = new Date();
  startDate = signal(new Date(this.today.getFullYear(), 0, 1)); // 1 de enero
  endDate = signal(new Date(this.today.getFullYear(), 11, 31)); // 31 de diciembre

  // Generar meses para el header
  months = computed(() => {
    const months: { name: string; days: number; startDay: number }[] = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const year = this.today.getFullYear();
    
    let dayCounter = 0;
    for (let i = 0; i < 12; i++) {
      const daysInMonth = new Date(year, i + 1, 0).getDate();
      months.push({
        name: monthNames[i],
        days: daysInMonth,
        startDay: dayCounter
      });
      dayCounter += daysInMonth;
    }
    return months;
  });

  totalDays = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  });

  // Posición de la línea del día actual
  todayPosition = computed(() => {
    const start = this.startDate();
    const daysDiff = Math.ceil((this.today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return (daysDiff / this.totalDays()) * 100;
  });

  calculateBar(resolution: Resolution): GanttBar {
    const start = this.startDate();
    const totalDays = this.totalDays();
    
    const resStart = new Date(resolution.startDate);
    const resEnd = resolution.endDate ? new Date(resolution.endDate) : new Date(this.today.getFullYear(), 11, 31);
    
    const startDiff = Math.max(0, Math.ceil((resStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const endDiff = Math.ceil((resEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const left = (startDiff / totalDays) * 100;
    const width = ((endDiff - startDiff + 1) / totalDays) * 100;
    
    // Colores variados para las barras
    const colors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#9334e6', '#00acc1'];
    const colorIndex = resolution.name.length % colors.length;
    
    return {
      resolution,
      left: Math.max(0, left),
      width: Math.min(100 - left, width),
      color: colors[colorIndex]
    };
  }

  private parseDate(value: string | Date | Timestamp | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if ((value as any)?.toDate) return (value as Timestamp).toDate();
    return new Date(value as string);
  }

  completedDate(resolution: Resolution): Date | null {
    return this.parseDate(resolution.completedAt);
  }

  completionPosition(resolution: Resolution): number | null {
    if (!resolution.completed) return null;

    const completed = this.completedDate(resolution);
    if (!completed) return null;

    const start = this.startDate();
    const total = this.totalDays();
    const dayDiff = Math.ceil((completed.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const position = (dayDiff / total) * 100;

    // Asegurar que la marca quede dentro del rango visible del año
    return Math.min(Math.max(position, 0), 100);
  }
}
