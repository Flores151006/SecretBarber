// ─────────────────────────────────────────────────────────────────────────────
// main.ts
//
// Punto de entrada de la aplicación Angular.
// Este es el primer archivo que ejecuta el navegador. Su única misión es
// arrancar (bootstrap) la aplicación pasándole el componente raíz y la
// configuración global.
//
// DECISIÓN DE DISEÑO: usamos bootstrapApplication() en lugar del antiguo
// AppModule. Desde Angular 14+ existe el enfoque "standalone", que elimina
// la necesidad de un NgModule y hace la app más ligera y sencilla de entender.
// ─────────────────────────────────────────────────────────────────────────────

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig }            from './app/app.config';
import { AppComponent }         from './app/app';
import AOS from 'aos';
import 'aos/dist/aos.css';

// AOS (Animate On Scroll) es una librería que añade animaciones CSS cuando
// el usuario hace scroll y un elemento entra en pantalla.
// - duration: cuántos ms dura la animación (600 ms es suave y rápido)
// - easing:   curva de aceleración (ease-out = empieza rápido, termina suave)
// - once:     true significa que la animación solo ocurre una vez por elemento
//   (si fuera false, se repetiría cada vez que el elemento entre/salga del viewport)
AOS.init({
    duration: 600,
    easing: 'ease-out',
    once: true
});

// bootstrapApplication es la función que "enciende" Angular.
// Recibe el componente raíz (AppComponent) y la configuración (appConfig),
// que contiene el router, interceptores HTTP, etc.
// .catch() captura cualquier error fatal durante el arranque
// (por ejemplo, si falla la inyección de dependencias) y lo muestra en consola.
bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));
