import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { PetsService } from '../../services/pets.service';
import { Pet } from '../../models/pet.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { calculateAge } from '../../utils/date.utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
  private petsService = inject(PetsService);

  paginator = viewChild<MatPaginator>(MatPaginator);

  displayedColumns: string[] = ['photo', 'name', 'species', 'age'];

  // Convert the service Observable (already filtered server-side) to a Signal for simpler template bindings
  private petsSignal = toSignal(this.petsService.listPublic$(), { initialValue: [] as Pet[] });

  // Public pets are provided directly by the service query
  publicPets = computed(() => this.petsSignal() as Pet[]);

  dataSource = new MatTableDataSource<Pet>([]);
  isLoading = signal(true);

  // Use shared helper
  calculateAge = calculateAge;

  constructor() {
    // Keep the MatTableDataSource in sync with the publicPets signal
    effect(() => {
      const list = this.publicPets();
      this.dataSource.data = list;
      // mark loading false after first run
      this.isLoading.set(false);
    });
  }

  ngAfterViewInit() {
    const paginatorInstance = this.paginator();
    if (paginatorInstance) {
      this.dataSource.paginator = paginatorInstance;
    }
  }
}
