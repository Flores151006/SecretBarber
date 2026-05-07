import { Routes } from '@angular/router';
import { authGuard }  from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

    // ─── Rutas públicas ───────────────────────────────────────────────────────
    {
        path: '',
        loadComponent: () => import('./features/home/home')
            .then(m => m.HomeComponent)
    },
    {
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
        path: 'verificar-email',
        loadComponent: () => import('./features/auth/verificar-email/verificar-email')
            .then(m => m.VerificarEmailComponent)
    },
    {
        path: 'confirmar-email',
        loadComponent: () => import('./features/auth/confirmar-email/confirmar-email')
            .then(m => m.ConfirmarEmailComponent)
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
    {
        path: 'reservas',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/bookings')
            .then(m => m.BookingsComponent)
    },
    {
        path: 'reserva/confirmada',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/booking-success/booking-success')
            .then(m => m.BookingSuccessComponent)
    },
    {
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
    path: 'cortes',
    loadComponent: () => import('./features/gallery/gallery')
        .then(m => m.GalleryComponent)
},

    // ─── Rutas Admin (requieren login + rol Admin) ────────────────────────────
    {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./features/admin/admin-layout/admin-layout')
            .then(m => m.AdminLayoutComponent),  // ← layout con sidebar
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
    {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found')
            .then(m => m.NotFoundComponent)
    }
];