import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-settings-header',
	standalone: true,
	imports: [
		TranslateModule
	],
	template: `<div class="tw-text-white tw-text-2xl tw-font-semibold">{{title | translate}}</div>`
})
export class SettingsHeaderComponent {
	@Input() section: string;
	@Input({required: true}) title: string;
}
