import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig }            from './app/app.config';
import { AppComponent }         from './app/app';
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init({
    duration: 600,
    easing: 'ease-out',
    once: true
});


bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));