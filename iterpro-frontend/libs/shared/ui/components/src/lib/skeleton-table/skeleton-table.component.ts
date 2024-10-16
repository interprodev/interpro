import { Component, Input } from '@angular/core';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';

@Component({
	selector: 'iterpro-skeleton-table',
	standalone: true,
	imports: [ArrayFromNumberPipe, PrimeNgModule],
	templateUrl: './skeleton-table.component.html',
})
export class SkeletonTableComponent {
	@Input({required: true}) rows!: number;
	@Input({required: true}) cols!: number;
	@Input() showProfilePic = false; // if true, show profile pic in the first column
}
