import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnDestroy,
	Output,
	ViewEncapsulation
} from '@angular/core';
import { ChartTypeRegistry } from 'chart.js';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';
import annotationPlugin from 'chartjs-plugin-annotation';
import datalabelsPlugin from 'chartjs-plugin-datalabels';

Chart.register(...[annotationPlugin, datalabelsPlugin]);
@Component({
	standalone: true,
	selector: 'iterpro-chart',
	styles: [
		`
			.flex {
				display: flex;
				align-items: center;
			}

			.chart-container {
				position: relative;
				margin: auto;
				height: 100%;
				width: 100%;
			}
		`
	],
	template: `
		<div class="chart-container">
			<canvas
				[attr.width]="responsive && !width ? null : width"
				[attr.height]="responsive && !height ? null : height"
				(click)="onCanvasClick($event)"
			></canvas>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements AfterViewInit, OnDestroy {
	@Input() type!: string;
	@Input() plugins: any[] = [];
	@Input() width!: string;
	@Input() height!: string;
	@Input() responsive = true;

	@Output() dataSelect: EventEmitter<any> = new EventEmitter();

	initialized!: boolean;
	_data: any;
	_options: any = {};
	chart: any;

	constructor(public el: ElementRef) {}

	@Input() get data(): any {
		return this._data;
	}

	set data(val: any) {
		this._data = val;
		this.reinit();
	}

	@Input() get options(): any {
		return this._options;
	}

	set options(val: any) {
		this._options = val;
		this.reinit();
	}

	ngAfterViewInit() {
		this.initChart();
		this.initialized = true;
	}

	onCanvasClick(event: any) {
		if (this.chart) {
			const element = this.chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
			const dataset = this.chart.getElementsAtEventForMode(event, 'dataset', { intersect: true }, false);

			if (element && element[0] && dataset) {
				this.dataSelect.emit({ originalEvent: event, element: element[0], dataset: dataset });
			}
		}
	}

	initChart() {
		const opts = this.options || {};
		opts.responsive = this.responsive;

		// allows chart to resize in responsive mode
		if (opts.responsive && (this.height || this.width)) {
			opts.maintainAspectRatio = false;
		}

		this.chart = new Chart(this.el.nativeElement.children[0].children[0], {
			type: this.type as keyof ChartTypeRegistry,
			data: this.data,
			options: this.options,
			plugins: this.plugins
		});
	}

	getCanvas() {
		return this.el.nativeElement.children[0].children[0];
	}

	getBase64Image() {
		return this.chart.toBase64Image();
	}

	refresh() {
		if (this.chart) {
			this.chart.update();
		}
	}

	reinit() {
		if (this.chart) {
			this.chart.destroy();
			this.initChart();
		}
	}

	ngOnDestroy() {
		if (this.chart) {
			this.chart.destroy();
			this.initialized = false;
			this.chart = null;
		}
	}
}
