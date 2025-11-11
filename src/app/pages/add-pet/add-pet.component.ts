import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PetsService } from '../../services/pets.service';
import { AuthService } from '../../services/auth.service';
import type { Pet } from '../../models/pet.model';

@Component({
  selector: 'app-add-pet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-pet.component.html',
  styleUrls: ['./add-pet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPetComponent {
  private fb = inject(FormBuilder);
  private petsService = inject(PetsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    species: ['', [Validators.required]],
    birthdate: ['', [Validators.required]],
    mode: ['Private', [Validators.required]],
    description: [''],
  });

  isSubmitting = false;

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const user = this.authService.user();

    if (!user) {
      this.snack.open('You must be logged in to add a pet', 'Close', { duration: 3000 });
      this.isSubmitting = false;
      return;
    }

    const formValue = this.form.value;
    const pet: Omit<Pet, 'id' | 'createdAt' | 'lastModify'> = {
      name: formValue.name!,
      species: formValue.species!,
      birthdate: formValue.birthdate!,
      mode: (formValue.mode as 'Public' | 'Private') || 'Private',
      description: formValue.description || undefined,
      userId: user.uid,
    };

    try {
      await this.petsService.add(pet);
      this.snack.open('Pet added successfully', 'Close', { duration: 2500 });
      await this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.snack.open(e?.message || 'Failed to add pet', 'Close', { duration: 4000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard']);
  }
}
