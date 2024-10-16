import { inject, Pipe, PipeTransform } from '@angular/core';
import { CollectionToSection } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
	standalone: true,
	name: 'sectionTooltip'
})
export class SectionTooltipPipe implements PipeTransform {
	#translate = inject(TranslateService);
	transform(redirects: CollectionToSection[] = []): string {
		return (redirects || []).map(({ label }) => this.#translate.instant(label)).join(', ');
	}
}
