import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivitiesService } from '../../../../services/activities.service';
import { AuthService } from '../../../../services/auth.service';
import type { Activity } from '../../../../models/activity.model';

@Component({
  selector: 'app-add-activity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-activity-form.component.html',
  styleUrls: ['./add-activity-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddActivityFormComponent {
  private activitiesService = inject(ActivitiesService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly petId = input.required<string>();
  readonly activityAdded = output<void>();

  readonly activityForm = this.fb.group({
    type: ['', Validators.required],
    notes: [''],
  });

  async addActivity() {
    const user = this.auth.user();
    const id = this.petId();
    if (!user || !id) return;
    
    const value = this.activityForm.value;
    if (!value.type) return;

    const newAct: Partial<Activity> = {
      petId: id,
      type: value.type,
      notes: value.notes || '',
      timestamp: new Date().toISOString(),
      userId: user.uid,
    } as any;

    await this.activitiesService.add(newAct);
    this.activityForm.reset();
    this.activityAdded.emit();
  }
}
