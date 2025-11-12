import { Component, ChangeDetectionStrategy, inject, signal, effect, input, viewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivitiesService } from '../../../../services/activities.service';
import { AddActivityFormComponent } from '../add-activity-form/add-activity-form.component';
import type { Activity } from '../../../../models/activity.model';

@Component({
  selector: 'app-activities-section',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    AddActivityFormComponent,
  ],
  templateUrl: './activities-section.component.html',
  styleUrls: ['./activities-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesSectionComponent implements AfterViewInit {
  private activitiesService = inject(ActivitiesService);
  private fb = inject(FormBuilder);

  readonly petId = input.required<string>();
  readonly isOwner = input<boolean>(false);

  readonly activities = signal<Activity[]>([]);
  readonly dataSource = new MatTableDataSource<Activity>([]);
  readonly editingActivityId = signal<string | null>(null);
  readonly activityEditForms = new Map<string, ReturnType<typeof this.createActivityEditForm>>();

  paginator = viewChild<MatPaginator>(MatPaginator);

  get displayedColumns(): string[] {
    return this.isOwner() ? ['date', 'type', 'notes', 'actions'] : ['date', 'type', 'notes'];
  }

  constructor() {
    effect(() => {
      const id = this.petId();
      if (!id) return;
      this.activitiesService.listByPet$(id).subscribe((rows) => {
        this.activities.set(rows);
        this.dataSource.data = rows;
      });
    });
  }

  ngAfterViewInit() {
    const p = this.paginator();
    if (p) {
      this.dataSource.paginator = p;
    }
  }

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
    await this.activitiesService.update(activity.id, updates);
    this.editingActivityId.set(null);
    this.activityEditForms.delete(activity.id);
  }

  async deleteActivity(activity: Activity) {
    if (!this.isOwner()) return;
    const confirmed = confirm(`Delete activity "${activity.type}"?`);
    if (!confirmed) return;
    await this.activitiesService.delete(activity.id);
  }

  isEditingActivity(activityId: string): boolean {
    return this.editingActivityId() === activityId;
  }

  getActivityEditForm(activityId: string) {
    return this.activityEditForms.get(activityId);
  }
}
