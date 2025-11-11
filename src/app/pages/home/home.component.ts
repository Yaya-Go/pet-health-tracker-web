import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { PetsService } from '../../services/pets.service';
import { Pet } from '../../models/pet.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private petsService = inject(PetsService);

  displayedColumns: string[] = ['photo', 'name', 'species', 'age'];

  // Convert the service Observable (already filtered server-side) to a Signal for simpler template bindings
  private petsSignal = toSignal(this.petsService.listPublic$(), { initialValue: [] as Pet[] });

  // Public pets are provided directly by the service query
  publicPets = computed(() => this.petsSignal() as Pet[]);

  dataSource = new MatTableDataSource<Pet>([]);
  isLoading = signal(true);

  constructor() {
    // Keep the MatTableDataSource in sync with the publicPets signal
    effect(() => {
      const list = this.publicPets();
      this.dataSource.data = list;
      // mark loading false after first run
      this.isLoading.set(false);
    });
  }
  /**
   * Calculate age in years from a birthdate string (ISO format).
   */
  calculateAge(birthdate: string): number {
    const today = new Date();
    const birth = new Date(birthdate);
    console.log('Calculating age for birthdate:', birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }
}
