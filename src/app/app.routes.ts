import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddPetComponent } from './pages/add-pet/add-pet.component';
import { PetDetailComponent } from './pages/pet-detail/pet-detail.component';
import { authGuard } from './guards/auth.guard';
import { petExistsGuard } from './guards/pet-exists.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'add-pet', component: AddPetComponent, canActivate: [authGuard] },
  { path: 'pets/:id', component: PetDetailComponent, canActivate: [petExistsGuard] },
];
