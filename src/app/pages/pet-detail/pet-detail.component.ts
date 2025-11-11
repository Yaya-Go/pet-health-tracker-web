import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Removed table & paginator modules from parent; handled in child components now.
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivitiesSectionComponent } from './components/activities-section/activities-section.component';
import { GallerySectionComponent } from './components/gallery-section/gallery-section.component';

import { PetsService } from '../../services/pets.service';
import { AuthService } from '../../services/auth.service';
import type { Pet } from '../../models/pet.model';
import { calculateAge } from '../../utils/date.utils';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  // Table/paginator removed from parent; children manage their own data tables.
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    ReactiveFormsModule,
    ActivitiesSectionComponent,
    GallerySectionComponent,
  ],
  templateUrl: './pet-detail.component.html',
  styleUrls: ['./pet-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetDetailComponent {
  private route = inject(ActivatedRoute);
  private petsService = inject(PetsService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  readonly petId = signal<string>('');
  readonly pet = signal<Pet | null>(null);
  readonly isLoading = signal(true);
  readonly isOwner = signal(false);
  readonly isEditing = signal(false);

  // Pet edit form
  readonly petForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    species: ['', [Validators.required]],
    birthdate: [null as Date | null, [Validators.required]],
    mode: ['Private' as 'Public' | 'Private', [Validators.required]],
    description: [''],
  });

  // No longer handles activities or gallery directly; delegated to child components.

  constructor() {
    // get petId from route
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.petId.set(id);

    // subscribe to pet doc
    const pet$ = this.petsService.doc$(id);
    const petSig = toSignal(pet$, { initialValue: undefined as unknown as Pet | undefined });

    effect(() => {
      const p = petSig();
      if (p) {
        this.pet.set(p);
        this.isLoading.set(false);
        const user = this.auth.user();
        this.isOwner.set(!!user && user.uid === p.userId);
        // Initialize form with pet data
        this.petForm.patchValue({
          name: p.name,
          species: p.species,
          birthdate: p.birthdate ? new Date(p.birthdate) : null,
          mode: p.mode,
          description: p.description || '',
        });
      }
    });
  }
  // Editing helpers for pet summary
  startEdit() {
    this.isEditing.set(true);
  }

  cancelEdit() {
    const p = this.pet();
    if (p) {
      this.petForm.patchValue({
        name: p.name,
        species: p.species,
        birthdate: p.birthdate ? new Date(p.birthdate) : null,
        mode: p.mode,
        description: p.description || '',
      });
    }
    this.isEditing.set(false);
  }

  async saveEdit() {
    if (this.petForm.invalid) return;
    const p = this.pet();
    if (!p) return;
    const value = this.petForm.value;
    await this.petsService.update(p.id, {
      name: value.name!,
      species: value.species!,
      birthdate: (value.birthdate as Date).toISOString(),
      mode: value.mode!,
      description: value.description || '',
      lastModify: new Date().toISOString(),
    });
    this.isEditing.set(false);
  }

  // Shared helper for template
  calculateAge = calculateAge;
}
