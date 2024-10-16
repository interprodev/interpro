import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MetricThreshold, ThresholdCategory } from '../../interfaces';

@Component({
	selector: 'iterpro-threshold-test',
	templateUrl: './threshold-test.component.html',
	styleUrls: ['./threshold-test.component.scss']
})
export class ThresholdTestComponent {
	@Input({required: true}) editMode: boolean;
	@Input({required: true}) playerThresholdsTests;
	@Input({required: true}) teamMetricsTests;
	@Input({required: true}) teamGoSettings: any[] = [];
	@Output() save: EventEmitter<ThresholdTestEmitterModel> = new EventEmitter<ThresholdTestEmitterModel>();
	dialogModel: MetricThreshold;
	category: ThresholdCategory = '_thresholdsTests';
	showSemaphoreDialog: boolean;
	dialogAbsMode: boolean;

	isThresholdGoScore({ name, metric }: MetricThreshold): boolean {
		return (this.teamGoSettings as any[])
			.slice(1)
			.some(({ testName, metricName }) => testName === name && metricName === metric);
	}

	openDialog(threshold: MetricThreshold) {
		this.dialogAbsMode = false;
		if (this.editMode) {
			this.showSemaphoreDialog = true;
			this.dialogModel = threshold;
			const { testId } = this.teamMetricsTests.find(
				({ testName, metricName }) => testName === this.dialogModel.name && metricName === this.dialogModel.metric
			);
		}
	}

	discard() {
		this.showSemaphoreDialog = false;
	}

	saveDialog() {
		let playerThresholdsTestsIndex: number;
		if (this.category === '_thresholds') {
			console.warn('category not supported');
			return;
		} else {
			playerThresholdsTestsIndex = this.playerThresholdsTests.findIndex(
				({ name, metric }) => name === this.dialogModel.name && metric === this.dialogModel.metric
			);
		}
		this.save.emit({
			dialogModel: this.dialogModel,
			playerThresholdsTestsIndex: playerThresholdsTestsIndex
		});
		this.showSemaphoreDialog = false;
	}
}

export interface ThresholdTestEmitterModel {
	dialogModel: MetricThreshold;
	playerThresholdsTestsIndex: number;
}
