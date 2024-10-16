import { Component, Input } from '@angular/core';
import { MetricThreshold } from '../../interfaces';

@Component({
	selector: 'iterpro-semaphore-input',
	templateUrl: './semaphore-input.component.html',
	styleUrls: ['./semaphore-input.component.css']
})
export class SemaphoreInputComponent {
	@Input({required: true}) absMode = false;
	@Input({required: true}) index = 0;
	@Input({required: true}) model: MetricThreshold;
}
