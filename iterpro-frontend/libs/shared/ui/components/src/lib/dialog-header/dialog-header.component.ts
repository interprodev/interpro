import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-dialog-header',
	standalone: true,
	imports: [
		TranslateModule
	],
	template: `<div class="tw-text-white tw-text-2xl tw-font-semibold">{{title | translate}}</div>`
})
export class DialogHeaderComponent {
	@Input() title!: string;
}
