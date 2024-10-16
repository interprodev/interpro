import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MetricThreshold, ThresholdCategory } from '../../interfaces';
import { convertFromAbsIntervals, convertFromPercIntervals } from '../../services/utils';

@Component({
	selector: 'iterpro-threshold-semaphore-dialog',
	templateUrl: './threshold-semaphore-dialog.component.html',
	styleUrls: ['./threshold-semaphore-dialog.component.scss']
})
export class ThresholdSemaphoreDialogComponent {
	@Input({required: true}) category: ThresholdCategory;
	@Input({required: true}) dialogModel: MetricThreshold;
	@Input({required: true}) dialogAbsMode: boolean;
	@Output() saveDialog: EventEmitter<any> = new EventEmitter<any>();
	@Output() discard: EventEmitter<any> = new EventEmitter<any>();

	setDialogAbsMode(value: boolean) {
		this.dialogAbsMode = value;
		if (this.dialogAbsMode) {
			this.dialogModel.absIntervals = convertFromPercIntervals(this.dialogModel);
		} else {
			this.dialogModel.intervals = convertFromAbsIntervals(this.dialogModel);
		}
	}

	isSemaphore(n: number): boolean {
		return `${this.dialogModel.semaphoreType}` === `${n}`;
	}

	selectInterval(semaphore: number = 1) {
		if (!this.dialogModel.semaphoreType || !this.isSemaphore(semaphore)) {
			if (semaphore === 3) {
				this.dialogModel.intervals = [null, null, null, null];
				this.dialogModel.absIntervals = [null, null, null, null];
			} else {
				this.dialogModel.intervals = [null, null];
				this.dialogModel.absIntervals = [null, null];
			}
		}
		this.dialogModel.semaphoreType = String(semaphore);
	}

	save() {
		if (this.dialogAbsMode) {
			this.dialogModel.intervals = convertFromAbsIntervals(this.dialogModel);
		}
		this.saveDialog.emit();
	}
}
