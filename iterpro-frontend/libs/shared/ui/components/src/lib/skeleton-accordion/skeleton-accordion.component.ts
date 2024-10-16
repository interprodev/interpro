import { Component, Input } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';
import { SharedModule } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-skeleton-accordion',
	standalone: true,
	imports: [
		AccordionModule,
		ArrayFromNumberPipe,
		SharedModule,
		SkeletonModule,
		TranslateModule
	],
	templateUrl: './skeleton-accordion.component.html'
})
export class SkeletonAccordionComponent {
	@Input({required: true}) accordions = 3;
	@Input() showTitle = false;
}
