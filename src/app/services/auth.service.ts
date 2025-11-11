import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  /** Signal that holds the current Firebase user (or null) for template-friendly access */
  readonly user = signal<any | null>(null);

  /** Observable that emits the current Firebase user or null */
  readonly authState$: Observable<any> = new Observable((subscriber) =>
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // Reload user to get fresh data (especially important for displayName after page refresh)
        await user.reload();
        this.user.set(user);
      } else {
        this.user.set(null);
      }
      subscriber.next(user);
    })
  );

  constructor() {
    // Initialize auth state listener immediately by subscribing
    // This ensures onAuthStateChanged fires when the app starts, including after page refresh
    this.authState$.subscribe();
  }

  async signIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    // Refresh the user signal after sign in
    this.user.set({ ...credential.user });
    return credential;
  }

  async register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Register and immediately set the user's display name.
   * Returns the created user credential.
   */
  async registerWithDisplayName(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      // Refresh the user signal after profile update
      this.user.set({ ...credential.user });
    }
    return credential;
  }

  async sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  async signOut() {
    return this.auth.signOut();
  }
}
