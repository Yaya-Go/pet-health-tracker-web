import { Component, ChangeDetectionStrategy, inject, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PetsService } from '../../../../services/pets.service';
import type { Pet } from '../../../../models/pet.model';
import { Storage, ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from '@angular/fire/storage';

type GalleryItem = { name: string; fullPath: string; url: string };

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './gallery-section.component.html',
  styleUrls: ['./gallery-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GallerySectionComponent {
  private storage = inject(Storage);
  private petsService = inject(PetsService);

  readonly pet = input<Pet | null>(null);
  readonly isOwner = input<boolean>(false);

  readonly gallery = signal<GalleryItem[]>([]);
  readonly uploading = signal(false);

  constructor() {
    effect(() => {
      const p = this.pet();
      if (p) {
        this.loadImages(p);
      }
    });
  }

  private storageBasePath(pet: Pet): string {
    return `pets/${pet.userId}/${pet.id}/images`;
  }

  async loadImages(p: Pet) {
    try {
      const listRef = ref(this.storage, this.storageBasePath(p));
      const res = await listAll(listRef);
      const urls = await Promise.all(
        res.items.map(async (item) => ({ name: item.name, fullPath: item.fullPath, url: await getDownloadURL(item) }))
      );
      this.gallery.set(urls);
    } catch (e) {
      console.error('Error loading images', e);
    }
  }

  async onFileSelected(event: Event) {
    const p = this.pet();
    if (!p || !this.isOwner()) return;
    const inputEl = event.target as HTMLInputElement;
    if (!inputEl.files || inputEl.files.length === 0) return;

    this.uploading.set(true);
    const files = Array.from(inputEl.files);
    try {
      for (const file of files) {
        const fileRef = ref(this.storage, `${this.storageBasePath(p)}/${Date.now()}-${file.name}`);
        await uploadBytesResumable(fileRef, file);
      }
      await this.loadImages(p);
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      this.uploading.set(false);
      inputEl.value = '';
    }
  }

  async deleteImage(item: GalleryItem) {
    const p = this.pet();
    if (!p || !this.isOwner()) return;
    try {
      const fileRef = ref(this.storage, item.fullPath);
      await deleteObject(fileRef);
      await this.loadImages(p);
    } catch (e) {
      console.error('Delete failed', e);
    }
  }

  async setAsPhoto(item: GalleryItem) {
    const p = this.pet();
    if (!p || !this.isOwner()) return;
    try {
      await this.petsService.update(p.id, { photoUrl: item.url, lastModify: new Date().toISOString() });
    } catch (e) {
      console.error('Set photo failed', e);
    }
  }
}
