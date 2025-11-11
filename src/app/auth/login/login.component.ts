import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isSubmitting = false;

  async onLogin() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.isSubmitting = true;
    const { email, password } = this.form.value as { email: string; password: string };
    try {
      await this.authService.signIn(email, password);
      this.snack.open('Signed in', 'Close', { duration: 2500 });
      await this.router.navigate(['/']);
    } catch (e: any) {
      this.snack.open(e?.message || 'Sign in failed', 'Close', { duration: 4000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  async onForgot() {
    const email = this.form.get('email')?.value as string;
    if (!email)
      return this.snack.open('Please enter your email above', 'Close', { duration: 3000 });
    try {
      await this.authService.sendPasswordReset(email);
      this.snack.open('Password reset email sent', 'Close', { duration: 3500 });
    } catch (e: any) {
      this.snack.open(e?.message || 'Reset failed', 'Close', { duration: 4000 });
    }
    return;
  }
}
