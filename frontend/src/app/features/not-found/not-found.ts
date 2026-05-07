import { Component } from '@angular/core';
import { RouterLink }      from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink, TranslateModule, NgIconComponent],
    templateUrl: './not-found.html'
})
export class NotFoundComponent {}