import { LowerCasePipe, NgClass, NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [NgIf, NgClass, LowerCasePipe],
	selector: 'iterpro-player-flag',
	template: `<span *ngIf="!!lang && !!title" class="fi" [ngClass]="'fi-' + lang | lowercase" [title]="title"></span> `
})
export class PlayerFlagComponent implements OnChanges {
	@Input({ required: true }) lang = '';
	title!: string;

	readonly #translateService = inject(TranslateService);

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['lang']) {
			const flagKey = `nationalities.${this.lang}`;
			const title = this.#translateService.instant(flagKey);
			this.title = title !== flagKey ? title : '';
		}
	}
}
