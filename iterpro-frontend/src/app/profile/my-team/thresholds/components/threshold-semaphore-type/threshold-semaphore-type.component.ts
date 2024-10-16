import { Component, Input } from '@angular/core';

@Component({
	selector: 'iterpro-threshold-semaphore-type',
	templateUrl: './threshold-semaphore-type.component.html',
	styleUrls: ['./threshold-semaphore-type.component.css']
})
export class ThresholdSemaphoreTypeComponent {
	@Input({required: true}) type: string;
}
