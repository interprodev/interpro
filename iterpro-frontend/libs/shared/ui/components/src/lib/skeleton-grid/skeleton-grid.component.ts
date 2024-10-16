import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';

@Component({
	selector: 'iterpro-skeleton-grid',
	standalone: true,
	imports: [PrimeNgModule, NgClass, ArrayFromNumberPipe],
	templateUrl: './skeleton-grid.component.html'
})
export class SkeletonGridComponent {
	@Input({ required: true }) columns!: number;
	@Input({ required: true }) rows!: number;
	@Input() span = 4;
	@Input() gap = 8;
	@Input() showTitle = false;
	@Input() skeletonStyleClass = 'tw-w-28'; // default width 112px
}
