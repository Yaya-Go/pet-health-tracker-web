import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { PetsService } from '../../services/pets.service';
import { AuthService } from '../../services/auth.service';
import { MatTableDataSource } from '@angular/material/table';
import type { Pet } from '../../models/pet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private petsService = inject(PetsService);
  private auth = inject(AuthService);

  displayedColumns: string[] = ['photo', 'name', 'species', 'age', 'actions'];
  dataSource = new MatTableDataSource<Pet>([]);
  isLoading = signal(true);
  pets = signal<Pet[]>([]);

  constructor() {
    // React to auth state changes and update pets signal
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        this.pets.set([]);
        this.isLoading.set(false);
        this.dataSource.data = [];
        return;
      }
      this.isLoading.set(true);
      this.petsService.listByUser$(user.uid).subscribe((list) => {
        const pets = list || [];
        this.pets.set(pets);
        this.dataSource.data = pets;
        this.isLoading.set(false);
      });
    });
  }

  // Helper to calculate age from birthdate string (same logic as HomeComponent)
  calculateAge(birthdate?: string): number | null {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
