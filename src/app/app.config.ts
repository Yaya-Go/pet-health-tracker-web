import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// Firebase / AngularFire
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
// Emulator connectors from the modular Firebase SDK
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from '../environments/firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    // Initialize Firebase (AngularFire providers)
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // Use factories so we can conditionally connect emulators when running locally
    provideAuth(() => {
      const auth = getAuth();
      // If running on localhost, connect to the Auth emulator
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          // Auth emulator expects a URL with http
          connectAuthEmulator(auth, 'http://localhost:9099');
        }
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        }
      }
      return firestore;
    }),
    provideStorage(() => {
      const storage = getStorage();
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          connectStorageEmulator(storage, 'localhost', 9199);
        }
      }
      return storage;
    }),
  ],
};
