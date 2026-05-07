import { inject }                                          from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot,
         RouterStateSnapshot }                             from '@angular/router';
import { Router }                                          from '@angular/router';
import { AuthService }                                     from '../services/auth.service';

export const authGuard: CanActivateFn = (
    _route: ActivatedRouteSnapshot,
    state:  RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
    }

    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};