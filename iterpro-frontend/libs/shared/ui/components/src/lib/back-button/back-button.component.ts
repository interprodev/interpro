import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
	standalone: true,
	imports: [TranslateModule, TooltipModule, FontAwesomeModule],
	selector: 'iterpro-back-button',
	templateUrl: './back-button.component.html'
})
export class BackButtonComponent {
	/** Services */
	readonly #location = inject(Location);

	/** Icons */
	readonly icons = {
		faChevronLeft
	};

	/** Methods */
	back() {
		this.#location.back();
	}
}
