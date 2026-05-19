// ─────────────────────────────────────────────────────────────────────────────
// admin.guard.ts
//
// Guard de autorización — protege las rutas exclusivas del panel de Admin.
//
// Este guard se aplica DESPUÉS de authGuard (el usuario ya está logueado).
// Su única función es comprobar que el rol del usuario sea 'Admin'.
//
// En app.routes.ts la ruta /admin tiene:
//   canActivate: [authGuard, adminGuard]
// Los guards se ejecutan en orden: primero authGuard (¿está logueado?)
// y si pasa, adminGuard (¿es admin?).
//
// Si un cliente logueado intenta ir a /admin, este guard lo redirige a /
// (la página de inicio) silenciosamente.
// ─────────────────────────────────────────────────────────────────────────────

import { inject }        from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router }        from '@angular/router';
import { AuthService }   from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (authService.isAdmin()) {
        return true; // Es admin → puede acceder al panel
    }

    // Es cliente o visitante → redirigir silenciosamente al inicio
    // No mostramos mensaje de error para no confirmar que existe el panel de admin
    router.navigate(['/']);
    return false;
};
