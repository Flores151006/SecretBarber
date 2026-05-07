import { Component } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './about.html'
})
export class AboutComponent {}