import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PetsService } from '../services/pets.service';
import { map, take } from 'rxjs/operators';

export const petExistsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const petsService = inject(PetsService);
  const router = inject(Router);
  const petId = route.paramMap.get('id');

  if (!petId) {
    router.navigate(['/home']);
    return false;
  }

  return petsService.doc$(petId).pipe(
    take(1),
    map((pet) => {
      if (pet) {
        return true;
      }
      router.navigate(['/home']);
      return false;
    })
  );
};
