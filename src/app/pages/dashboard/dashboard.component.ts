import { Component, ChangeDetectionStrategy, inject, signal, effect, viewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { PetsService } from '../../services/pets.service';
import { AuthService } from '../../services/auth.service';
import { MatTableDataSource } from '@angular/material/table';
import type { Pet } from '../../models/pet.model';
import { calculateAge } from '../../utils/date.utils';

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
    MatPaginatorModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewInit {
  private petsService = inject(PetsService);
  private auth = inject(AuthService);

  paginator = viewChild<MatPaginator>(MatPaginator);

  displayedColumns: string[] = ['photo', 'name', 'species', 'age', 'actions'];
  dataSource = new MatTableDataSource<Pet>([]);
  isLoading = signal(true);
  pets = signal<Pet[]>([]);

  // Use shared helper
  calculateAge = calculateAge;

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

  ngAfterViewInit() {
    const paginatorInstance = this.paginator();
    if (paginatorInstance) {
      this.dataSource.paginator = paginatorInstance;
    }
  }
}
