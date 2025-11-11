import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { PetsService } from '../../services/pets.service';
import { ActivitiesService } from '../../services/activities.service';
import { AuthService } from '../../services/auth.service';
import type { Pet } from '../../models/pet.model';
import type { Activity } from '../../models/activity.model';
import { calculateAge } from '../../utils/date.utils';

// Firebase Storage
import {
  Storage,
  ref,
  listAll,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject,
} from '@angular/fire/storage';

type GalleryItem = { name: string; fullPath: string; url: string };

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
  templateUrl: './pet-detail.component.html',
  styleUrls: ['./pet-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetDetailComponent {
  private route = inject(ActivatedRoute);
  private petsService = inject(PetsService);
  private activitiesService = inject(ActivitiesService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private storage = inject(Storage);
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

  // Activities
  readonly activities = signal<Activity[]>([]);
  readonly editingActivityId = signal<string | null>(null);
  readonly activityEditForms = new Map<string, ReturnType<typeof this.createActivityEditForm>>();

  get actDisplayedColumns(): string[] {
    return this.isOwner() ? ['date', 'type', 'notes', 'actions'] : ['date', 'type', 'notes'];
  }

  // Gallery
  readonly gallery = signal<GalleryItem[]>([]);
  readonly uploading = signal(false);

  // Add activity form (owner only)
  readonly activityForm = this.fb.group({
    type: ['', Validators.required],
    notes: [''],
  });

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
        // Load activities and images when pet is ready
        this.loadActivities();
        this.loadImages();
      }
    });
  }

  private storageBasePath(pet: Pet): string {
    // Structure: pets/{ownerUid}/{petId}/images/
    return `pets/${pet.userId}/${pet.id}/images`;
  }

  async loadImages() {
    const p = this.pet();
    if (!p) return;
    try {
      const listRef = ref(this.storage, this.storageBasePath(p));
      const res = await listAll(listRef);
      const urls = await Promise.all(
        res.items.map(async (item) => ({
          name: item.name,
          fullPath: item.fullPath,
          url: await getDownloadURL(item),
        }))
      );
      this.gallery.set(urls);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error loading images', e);
    }
  }

  async onFileSelected(event: Event) {
    const p = this.pet();
    if (!p) return;
    if (!this.isOwner()) return;
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.uploading.set(true);
    try {
      for (const file of Array.from(input.files)) {
        const path = `${this.storageBasePath(p)}/${Date.now()}-${file.name}`;
        const fileRef = ref(this.storage, path);
        await uploadBytesResumable(fileRef, file);
      }
      await this.loadImages();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Upload failed', e);
    } finally {
      this.uploading.set(false);
      // reset input
      (event.target as HTMLInputElement).value = '';
    }
  }

  async deleteImage(item: GalleryItem) {
    if (!this.isOwner()) return;
    try {
      const fileRef = ref(this.storage, item.fullPath);
      await deleteObject(fileRef);
      await this.loadImages();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Delete failed', e);
    }
  }

  async setAsPhoto(item: GalleryItem) {
    if (!this.isOwner()) return;
    const p = this.pet();
    if (!p) return;
    try {
      await this.petsService.update(p.id, {
        photoUrl: item.url,
        lastModify: new Date().toISOString(),
      });
      // refresh pet signal manually (update listener will reflect change soon)
      this.pet.set({ ...(p as Pet), photoUrl: item.url, lastModify: new Date().toISOString() });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Set photo failed', e);
    }
  }

  loadActivities() {
    const id = this.petId();
    if (!id) return;
    this.activitiesService.listByPet$(id).subscribe((rows) => this.activities.set(rows));
  }

  async addActivity() {
    if (!this.isOwner()) return;
    const p = this.pet();
    const user = this.auth.user();
    if (!p || !user) return;
    const value = this.activityForm.value;
    if (!value.type) return;
    const newAct: Partial<Activity> = {
      petId: p.id,
      type: value.type,
      notes: value.notes || '',
      timestamp: new Date().toISOString(),
      userId: user.uid,
    } as any;
    await this.activitiesService.add(newAct);
    this.activityForm.reset();
  }

  // Pet edit actions
  startEdit() {
    if (!this.isOwner()) return;
    this.isEditing.set(true);
  }

  cancelEdit() {
    const p = this.pet();
    if (p) {
      // Reset form to current pet data
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
    if (!this.isOwner() || this.petForm.invalid) return;
    const p = this.pet();
    if (!p) return;

    const formValue = this.petForm.value;
    const updates: Partial<Pet> = {
      name: formValue.name!,
      species: formValue.species!,
      birthdate: formValue.birthdate!.toISOString().split('T')[0],
      mode: formValue.mode!,
      description: formValue.description || undefined,
      lastModify: new Date().toISOString(),
    };

    try {
      await this.petsService.update(p.id, updates);
      // Update local signal
      this.pet.set({ ...p, ...updates });
      this.isEditing.set(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Update failed', e);
    }
  }

  // Activity edit actions
  createActivityEditForm(activity: Activity) {
    return this.fb.group({
      type: [activity.type, Validators.required],
      notes: [activity.notes || ''],
    });
  }

  startEditActivity(activity: Activity) {
    if (!this.isOwner()) return;
    this.editingActivityId.set(activity.id);
    if (!this.activityEditForms.has(activity.id)) {
      this.activityEditForms.set(activity.id, this.createActivityEditForm(activity));
    }
  }

  cancelEditActivity(activityId: string) {
    this.editingActivityId.set(null);
    this.activityEditForms.delete(activityId);
  }

  async saveActivityEdit(activity: Activity) {
    if (!this.isOwner()) return;
    const form = this.activityEditForms.get(activity.id);
    if (!form || form.invalid) return;

    const value = form.value;
    const updates: Partial<Activity> = {
      type: value.type!,
      notes: value.notes || '',
    };

    try {
      await this.activitiesService.update(activity.id, updates);
      this.editingActivityId.set(null);
      this.activityEditForms.delete(activity.id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Activity update failed', e);
    }
  }

  async deleteActivity(activity: Activity) {
    if (!this.isOwner()) return;
    
    const confirmed = confirm(`Delete activity "${activity.type}" from ${new Date(activity.timestamp).toLocaleDateString()}?`);
    if (!confirmed) return;

    try {
      await this.activitiesService.delete(activity.id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Activity delete failed', e);
    }
  }

  isEditingActivity(activityId: string): boolean {
    return this.editingActivityId() === activityId;
  }

  getActivityEditForm(activityId: string) {
    return this.activityEditForms.get(activityId);
  }

  // Use shared helper
  calculateAge = calculateAge;
}
