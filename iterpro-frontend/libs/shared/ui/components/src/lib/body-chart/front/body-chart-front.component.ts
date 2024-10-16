import { Component, HostListener, Input } from '@angular/core';
import { BodyChart, BodyChartInterface } from '../utils/interfaces';

@Component({
	standalone: true,
	selector: 'iterpro-body-chart-front',
	templateUrl: './body-chart-front.component.html',
	styleUrls: ['./../body-chart.component.css']
})
export class BodyChartFrontComponent implements BodyChartInterface {
	position: BodyChart = 'front';
	@Input() emitZoneClicked!: boolean;
	@Input() zoneClicked: any;
	@Input() zoneIn: any;
	@Input() zoneOut: any;

	@HostListener('click', ['$event'])
	onMouseClick(e) {
		if (!this.emitZoneClicked) return;
		const zone = e.target.getAttribute('class');
		if (zone) this.zoneClicked(this.position, zone);
	}

	@HostListener('mouseover', ['$event'])
	onMouseOver(e) {
		// console.warn('mouseover', e.target.getAttribute('class'));
		const zone = e.target.getAttribute('class');
		if (zone) this.zoneIn(this.position, zone);
	}

	@HostListener('mouseout', ['$event'])
	onMouseOut(e) {
		const zone = e.target.getAttribute('class');
		if (zone) this.zoneOut(this.position, zone);
	}
}
