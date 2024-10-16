import { Component, Input } from '@angular/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';

@Component({
	selector: 'iterpro-skeleton-picklist',
	standalone: true,
	imports: [
		PrimeNgModule,
		ArrayFromNumberPipe
	],
	templateUrl: './skeleton-picklist.component.html'
})
export class SkeletonPicklistComponent {
	@Input({required: true}) sourceLabel!: string;
	@Input({required: true}) targetLabel!: string;
	@Input({required: true}) sourceItems!: number;
	@Input({required: true}) targetItems!: number;
}
