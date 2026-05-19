// ─────────────────────────────────────────────────────────────────────────────
// app.config.ts
//
// Configuración central de la aplicación Angular (equivale al antiguo
// AppModule.providers[]). Aquí se registran TODOS los servicios globales:
// router, cliente HTTP, interceptores, gráficos, traducciones e iconos.
//
// DECISIÓN DE DISEÑO: centralizar los providers aquí permite que main.ts
// sea minimalista y que cada provider tenga una responsabilidad clara.
// Al usar el enfoque standalone (sin NgModule), esta constante es el
// único lugar donde se configura la infraestructura de la app.
// ─────────────────────────────────────────────────────────────────────────────

import { ApplicationConfig }                               from '@angular/core';
import { provideRouter }                                   from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi }        from '@angular/common/http';
import { HTTP_INTERCEPTORS }                               from '@angular/common/http';
import { AuthInterceptor }                                 from './core/interceptors/auth.interceptor';
import { provideCharts, withDefaultRegisterables }         from 'ng2-charts';
import { provideTranslateService }                         from '@ngx-translate/core';
import { provideTranslateHttpLoader }                      from '@ngx-translate/http-loader';
import { provideIcons, provideNgIconsConfig }              from '@ng-icons/core';

// Se importan individualmente los iconos Lucide que usa la app.
// Esto es "tree-shakeable": el bundler solo incluye en el bundle final
// los iconos que realmente se importan aquí, reduciendo el tamaño del JS.
import {
    lucideScissors, lucideCalendar, lucideClock, lucideCreditCard, lucideBanknote,
    lucideUser, lucideUsers, lucideSearch, lucideStar, lucideMessageCircle,
    lucidePencil, lucideTrash2, lucideEye, lucideEyeOff, lucideX, lucideCheck,
    lucideCheckCircle2, lucideXCircle, lucideAlertTriangle, lucideBarChart2,
    lucideShield, lucideLock, lucideCode2, lucideClipboardList, lucidePhone,
    lucideMenu, lucideLogOut, lucideHome, lucideArrowRight, lucideArrowLeft,
    lucideChevronDown, lucideChevronRight, lucidePlus, lucideMinus,
    lucideInfo, lucideRefreshCw, lucideMapPin, lucideGlobe, lucideHelpCircle,
    lucideImage, lucideSend, lucideBell, lucideSettings, lucideFilter,
    lucideChevronUp, lucideExternalLink, lucideMail, lucideSparkles,
    lucideWand2, lucideTag, lucidePackage,
    lucideCalendarRange, lucidePlay, lucidePause, lucideCheckCircle, lucideRefreshCcw,
    lucideKeyRound, lucideMailCheck, lucidePalette, lucideShieldAlert, lucideTriangleAlert,
    lucideMoon, lucideSun, lucideCamera,
    lucideLogIn, lucideUserPlus
} from '@ng-icons/lucide';

import { routes } from './app.routes';

// ApplicationConfig es el tipo TypeScript que Angular espera recibir en
// bootstrapApplication(). Obliga a que el objeto tenga la propiedad "providers".
export const appConfig: ApplicationConfig = {
    providers: [
        // provideRouter registra el sistema de enrutado con las rutas definidas
        // en app.routes.ts. Sin esto, Angular no sabría qué componente mostrar
        // para cada URL.
        provideRouter(routes),

        // provideHttpClient activa el módulo HTTP de Angular.
        // withInterceptorsFromDi() es necesario para que los interceptores
        // registrados con HTTP_INTERCEPTORS (ver abajo) sean reconocidos.
        // Sin esta opción, los interceptores de la API antigua no funcionarían.
        provideHttpClient(withInterceptorsFromDi()),

        // HTTP_INTERCEPTORS es un token de inyección especial que permite
        // encadenar múltiples interceptores. El flag "multi: true" es CRÍTICO:
        // le dice a Angular que NO sustituya el array sino que AÑADA este
        // interceptor al array existente. Sin multi:true, solo existiría un interceptor.
        // AuthInterceptor añade el JWT en la cabecera Authorization de cada petición.
        {
            provide:  HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi:    true
        },

        // provideCharts registra Chart.js globalmente para que ng2-charts
        // pueda dibujar gráficos de barras y donut en el panel de estadísticas.
        // withDefaultRegisterables() registra todos los tipos de gráfico disponibles.
        provideCharts(withDefaultRegisterables()),

        // provideTranslateService configura el sistema de internacionalización (i18n).
        // - fallbackLang: si una clave no existe en el idioma activo, usa 'es'
        // - defaultLanguage: idioma por defecto al arrancar la app
        provideTranslateService({ fallbackLang: 'es', defaultLanguage: 'es' }),

        // provideTranslateHttpLoader añade soporte para cargar traducciones desde
        // archivos JSON externos (aunque en este proyecto las traducciones están
        // incrustadas directamente en LanguageService con setTranslation).
        ...provideTranslateHttpLoader(),

        // provideNgIconsConfig establece el tamaño por defecto de todos los iconos.
        // 1.1em significa que el icono tendrá un 10% más de tamaño que el texto
        // que lo rodea, lo que suele verse proporcionado junto a labels.
        provideNgIconsConfig({ size: '1.1em' }),

        // provideIcons registra GLOBALMENTE todos los iconos SVG de Lucide que
        // usa la aplicación. Al tenerlos todos aquí en un único lugar, cualquier
        // componente puede usar <ng-icon name="lucideCalendar"> sin necesidad de
        // importar el icono en cada componente individual.
        provideIcons({
            lucideScissors, lucideCalendar, lucideClock, lucideCreditCard, lucideBanknote,
            lucideUser, lucideUsers, lucideSearch, lucideStar, lucideMessageCircle,
            lucidePencil, lucideTrash2, lucideEye, lucideEyeOff, lucideX, lucideCheck,
            lucideCheckCircle2, lucideXCircle, lucideAlertTriangle, lucideBarChart2,
            lucideShield, lucideLock, lucideCode2, lucideClipboardList, lucidePhone,
            lucideMenu, lucideLogOut, lucideHome, lucideArrowRight, lucideArrowLeft,
            lucideChevronDown, lucideChevronRight, lucidePlus, lucideMinus,
            lucideInfo, lucideRefreshCw, lucideMapPin, lucideGlobe, lucideHelpCircle,
            lucideImage, lucideSend, lucideBell, lucideSettings, lucideFilter,
            lucideChevronUp, lucideExternalLink, lucideMail, lucideSparkles,
            lucideWand2, lucideTag, lucidePackage,
            lucideCalendarRange, lucidePlay, lucidePause, lucideCheckCircle, lucideRefreshCcw,
            lucideKeyRound, lucideMailCheck, lucidePalette, lucideShieldAlert, lucideTriangleAlert,
            lucideMoon, lucideSun, lucideCamera,
            lucideLogIn, lucideUserPlus
        }),
    ]
};
