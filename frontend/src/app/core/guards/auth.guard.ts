// ─────────────────────────────────────────────────────────────────────────────
// auth.guard.ts
//
// Guard de autenticación — protege las rutas que requieren estar logueado.
//
// ¿Qué es un "guard" en Angular?
//   Es una función que Angular ejecuta ANTES de navegar a una ruta.
//   Si devuelve true → el usuario puede acceder.
//   Si devuelve false → se cancela la navegación y se redirige.
//
// ¿Cómo funciona en esta app?
//   Rutas como /reservas, /mis-reservas y /settings tienen "canActivate: [authGuard]"
//   en app.routes.ts. Si el usuario no está logueado e intenta ir a esas rutas,
//   este guard lo redirige a /login con la URL de destino guardada en queryParams.
//   Así, tras hacer login, Angular puede redirigir automáticamente donde quería ir.
//
//   Ejemplo: el usuario va a /reservas sin estar logueado
//   → Guard detecta que no hay token
//   → Redirige a /login?returnUrl=/reservas
//   → El componente login, al hacer login exitoso, lee returnUrl y redirige a /reservas
// ─────────────────────────────────────────────────────────────────────────────

import { inject }                                          from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot,
         RouterStateSnapshot }                             from '@angular/router';
import { Router }                                          from '@angular/router';
import { AuthService }                                     from '../services/auth.service';

// CanActivateFn es el tipo moderno de guard (Angular 15+), sin necesidad de clase
export const authGuard: CanActivateFn = (
    _route: ActivatedRouteSnapshot,   // _ = parámetro que no usamos (convención)
    state:  RouterStateSnapshot       // state.url = la URL a la que intentaba ir el usuario
) => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (authService.isLoggedIn()) {
        return true; // Tiene token → puede acceder a la ruta
    }

    // No tiene token → redirigir a login guardando la URL de destino
    // returnUrl permite que al hacer login se redirija al destino original
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
