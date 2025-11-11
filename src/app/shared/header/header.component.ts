import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  // Use the user signal from AuthService for template bindings
  user = this.auth.user;

  constructor() {}

  onLogin() {
    // Default behaviour: navigate to /login. Consumers can override by handling the route.
    this.router.navigate(['/login']);
  }

  async onLogout() {
    await this.auth.signOut();
    // after logout, navigate to home
    await this.router.navigate(['/']);
  }
}
