import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, RouterModule, TranslateModule, PrimeNgModule],
	selector: 'iterpro-redirect-icon',
	templateUrl: './redirect-icon.component.html',
	styles: [
		`
			i {
				cursor: pointer;
			}

			.disabled {
				pointer-events: none;
				cursor: default;
				opacity: 0.75;
			}

			.svgIcon {
				width: 1.4rem;
				height: 1.4rem;
			}
		`
	]
})
export class RedirectIconComponent {
	@Input() icon = '';
	@Input() path!: string;
	@Input() color = '#fafafa';
	@Input() params: { id?: string } & any;
	@Input() tooltip = 'to.planning.redirect';
	@Input() disabled = false;

	getLinkDA() {
		return [this.path, this.params];
	}

}
