import { ApplicationConfig }                               from '@angular/core';
import { provideRouter }                                   from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi }        from '@angular/common/http';
import { HTTP_INTERCEPTORS }                               from '@angular/common/http';
import { AuthInterceptor }                                 from './core/interceptors/auth.interceptor';
import { provideCharts, withDefaultRegisterables }         from 'ng2-charts';
import { provideTranslateService }                         from '@ngx-translate/core';
import { provideTranslateHttpLoader }                      from '@ngx-translate/http-loader';
import { provideIcons, provideNgIconsConfig }              from '@ng-icons/core';

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
    lucideMoon, lucideSun
} from '@ng-icons/lucide';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide:  HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi:    true
        },
        provideCharts(withDefaultRegisterables()),
        provideTranslateService({ fallbackLang: 'es', defaultLanguage: 'es' }),
        ...provideTranslateHttpLoader(),
        provideNgIconsConfig({ size: '1.1em' }),
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
            lucideMoon, lucideSun
        }),
    ]
};