import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'iterpro-star-svg',
	standalone: true,
	imports: [],
	templateUrl: './star-svg.component.html',
	styleUrl: './star-svg.component.scss'
})
export class StarSvgComponent {
	@Input({required: true}) value!: number;
}
