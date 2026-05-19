// ─────────────────────────────────────────────────────────────────────────────
// app.routes.ts
//
// Define el mapa de URL → componente de toda la aplicación.
//
// DECISIÓN DE DISEÑO: se usa lazy loading (loadComponent) en TODAS las rutas.
// Esto significa que el código de cada página NO se incluye en el bundle
// principal (main.js); Angular solo lo descarga cuando el usuario navega a
// esa ruta. Resultado: la app carga más rápido en el primer acceso.
//
// Comparación con import estático (NO lazy):
//   import { HomeComponent } from './features/home/home';
//   { path: '', component: HomeComponent }  // ← todo el código de Home va en main.js
//
// Con lazy loading:
//   { path: '', loadComponent: () => import('./features/home/home').then(m => m.HomeComponent) }
//   // ← el código de Home se descarga solo cuando el usuario visita '/'
//
// GUARDS: canActivate recibe un array de funciones/clases que deben devolver
// true para permitir el acceso. Si alguno devuelve false o un UrlTree (redirect),
// la navegación se cancela o redirige al login.
// ─────────────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { authGuard }  from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

    // ─── Rutas públicas ───────────────────────────────────────────────────────
    // Cualquier usuario (autenticado o no) puede acceder a estas rutas.
    {
        path: '',
        loadComponent: () => import('./features/home/home')
            .then(m => m.HomeComponent)
    },
    {
    // Callback de OAuth Google: Google redirige aquí después del login social.
    // Esta ruta lee el token de la URL y lo guarda en el estado de la app.
    path: 'auth/google',
    loadComponent: () => import('./features/auth/google-callback/google-callback')
        .then(m => m.GoogleCallbackComponent)
},
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login')
            .then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register')
            .then(m => m.RegisterComponent)
    },
    {
        // Pantalla informativa que pide al usuario verificar su email
        // tras registrarse. No requiere token en la URL.
        path: 'verificar-email',
        loadComponent: () => import('./features/auth/verificar-email/verificar-email')
            .then(m => m.VerificarEmailComponent)
    },
    {
        // Ruta que el usuario visita desde el enlace del correo de verificación.
        // Recibe un token como query param (?token=...) y activa la cuenta.
        path: 'confirmar-email',
        loadComponent: () => import('./features/auth/confirmar-email/confirmar-email')
            .then(m => m.ConfirmarEmailComponent)
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password')
            .then(m => m.ForgotPasswordComponent)
    },
    {
        // Recibe el token de reseteo como query param y permite cambiar la contraseña
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password')
            .then(m => m.ResetPasswordComponent)
    },
    {
        path: 'reviews',
        loadComponent: () => import('./features/reviews/reviews')
            .then(m => m.ReviewsComponent)
    },
    {
    path: 'reserva-confirmada',
    loadComponent: () => import('./features/bookings/booking-confirmation/booking-confirmation')
        .then(m => m.BookingConfirmationComponent)
},
{
    path: 'acerca-de',
    loadComponent: () => import('./features/about/about')
        .then(m => m.AboutComponent)
},
{
    path: 'ayuda',
    loadComponent: () => import('./features/help/help')
        .then(m => m.HelpComponent)
},

    // ─── Rutas privadas (requieren login) ─────────────────────────────────────
    // canActivate: [authGuard] hace que Angular llame al guard antes de cargar
    // el componente. Si el usuario no está autenticado, authGuard redirige a /login.
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/user/settings/settings')
            .then(m => m.SettingsComponent)
    },
    {
        path: 'reservas',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/bookings')
            .then(m => m.BookingsComponent)
    },
    {
        // Página de éxito de Stripe: Stripe redirige aquí después de un pago correcto
        path: 'reserva/confirmada',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/booking-success/booking-success')
            .then(m => m.BookingSuccessComponent)
    },
    {
        // Página de cancelación de Stripe: el usuario cerró la ventana de pago
        path: 'reserva/cancelada',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/booking-cancel/booking-cancel')
            .then(m => m.BookingCancelComponent)
    },
    {
        path: 'mis-reservas',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/mis-bookings/mis-bookings')
            .then(m => m.MisBookingsComponent)
    },
    {
    // La galería de cortes es pública (no requiere authGuard)
    path: 'cortes',
    loadComponent: () => import('./features/gallery/gallery')
        .then(m => m.GalleryComponent)
},

    // ─── Rutas Admin (requieren login + rol Admin) ────────────────────────────
    // Se usan DOS guards encadenados: primero authGuard (¿está logueado?)
    // y luego adminGuard (¿tiene rol Admin?). Ambos deben devolver true.
    {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        // El layout de admin tiene un sidebar; los sub-componentes se renderizan
        // dentro del <router-outlet> del AdminLayoutComponent (rutas hijas).
        loadComponent: () => import('./features/admin/admin-layout/admin-layout')
            .then(m => m.AdminLayoutComponent),  // ← layout con sidebar
        // children: rutas hijas que se renderizan DENTRO del AdminLayoutComponent.
        // La URL será /admin/reservas, /admin/usuarios, etc.
        // El layout (sidebar + header) persiste entre ellas sin recargarse.
        children: [
            {
                path: 'reservas',
                loadComponent: () => import('./features/admin/bookings/bookings')
                    .then(m => m.AdminBookingsComponent)
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./features/admin/users/users')
                    .then(m => m.UsersComponent)
            },
            {
                path: 'reviews',
                loadComponent: () => import('./features/admin/reviews/reviews')
                    .then(m => m.AdminReviewsComponent)
            },
            {
                // Redirección por defecto: /admin → /admin/reservas
                path: '',
                redirectTo: 'reservas',
                pathMatch: 'full'
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./features/admin/estadisticas/estadisticas')
                .then(m => m.EstadisticasComponent)
            }


        ]
    },

    // ─── 404 ──────────────────────────────────────────────────────────────────
    // La ruta '**' (wildcard) captura cualquier URL que no haya coincidido
    // con ninguna de las rutas anteriores. DEBE estar siempre al final del array
    // porque Angular evalúa las rutas en orden y usaría esta para todo si fuera la primera.
    {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found')
            .then(m => m.NotFoundComponent)
    }
];
