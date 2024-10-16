import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
	inject
} from '@angular/core';
import { Player, Wellness } from '@iterpro/shared/data-access/sdk';
import { BodyChartComponent } from '@iterpro/shared/ui/components';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import * as momentLib from 'moment';
import 'moment-duration-format';
import { extendMoment } from 'moment-range';
import { calcSleepDuration } from '../../utils/assessments.util';
import { cloneDeep } from 'lodash';
const moment = extendMoment(momentLib);

@Component({
	selector: 'iterpro-wellness-survey',
	templateUrl: './wellness-survey.component.html',
	styleUrls: ['wellness-survey.component.css']
})
export class WellnessSurveyComponent implements OnInit, OnChanges {
	@Input() player: Player;
	@Input() currentDay: Date;

	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() deleteEmitter: EventEmitter<any> = new EventEmitter<any>();
	@ViewChild(BodyChartComponent, { static: false }) bodyChart: BodyChartComponent;

	values: any[] = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];
	sliderVal: number[];
	sleep_hours: string;
	readonly sliderMinVal = 960; // 16.00h
	readonly sliderMaxVal = 2400; // 16.00h
	readonly minutesInADay = 1440;
	bodyDialogOpened: boolean;
	tempSorenessInjuries: any[] = [];
	sorenessInjuries: any[] = [];

	readonly #alertService = inject(AlertService);

	ngOnInit() {
		this.values = [];
		this.values.push({ label: '1', value: 1 });
		this.values.push({ label: '2', value: 2 });
		this.values.push({ label: '3', value: 3 });
		this.values.push({ label: '4', value: 4 });
		this.values.push({ label: '5', value: 5 });
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			this.player = cloneDeep(this.player);
			if (this.player.wellnesses.length === 0) {
				this.#alertService.notify('warn', 'assessment', 'alert.wellnessNotSubmitted', false);
				this.player.wellnesses[0] = new Wellness();
				this.player.wellnesses[0].date = moment(this.currentDay).startOf('day').toDate();
				this.player.wellnesses[0].locations = [];
			}
			this.initLocations();
			this.initSleepHours();
		}
	}

	private initLocations() {
		this.tempSorenessInjuries = [];
		if (this.bodyChart) this.resetBodyChartData();
		if (this.player.wellnesses[0].locations && this.player.wellnesses[0].locations.length > 0) {
			this.player.wellnesses[0].locations.forEach((zone: string) => {
				this.tempSorenessInjuries.push({
					location: `medical.infirmary.details.location.${zone}`,
					issue: 'medical.infirmary.details.issue.injury',
					currentStatus: 'medical.infirmary.details.statusList.rehab'
				});
			});
			this.sorenessInjuries = this.tempSorenessInjuries;
		}
	}

	private initSleepHours() {
		if (this.player.wellnesses[0] && this.player.wellnesses[0].sleep_start && this.player.wellnesses[0].sleep_end) {
			const startToMinutes = moment.duration(this.player.wellnesses[0].sleep_start).asMinutes();
			const endToMinutes = moment.duration(this.player.wellnesses[0].sleep_end).asMinutes();
			this.sliderVal = [this.convertToCorrectMinutesFromDatabase(startToMinutes), endToMinutes + this.minutesInADay];
		} else {
			this.sliderVal = [1350, 1950];
		}
		this.handleSliderChange({ values: this.sliderVal });
	}

	private convertToCorrectMinutesFromDatabase(value: number): number {
		if (value < this.sliderMinVal) {
			return value + this.minutesInADay;
		}
		return value;
	}

	save() {
		this.saveEmitter.emit(this.player);
		this.bodyChart.resetAllData();
	}

	delete() {
		this.deleteEmitter.emit(this.player);
	}

	handleSliderChange(event: any) {
		this.sliderVal = event.values;
		this.player.wellnesses[0].sleep_start = this.convertDecimalToTime(this.convertToCorrectMinutes(event.values[0]));
		this.player.wellnesses[0].sleep_end = this.convertDecimalToTime(this.convertToCorrectMinutes(event.values[1]));
		this.sleep_hours = calcSleepDuration(this.player.wellnesses[0].sleep_start, this.player.wellnesses[0].sleep_end);
	}

	convertToCorrectMinutes(value: number): number {
		if (value > this.minutesInADay) {
			return value - this.minutesInADay;
		}
		return value;
	}

	private convertDecimalToTime(decimal: number): string {
		let running, hours, minutes;
		running = decimal / 60;
		hours = Math.floor(running);
		running = running - hours;
		minutes = Math.round(running * 60);
		return (hours + ':' + minutes).toString();
	}

	onSorenessChange(event: any) {
		if (event.value <= 2) {
			this.bodyDialogOpened = true;
		}
		if (this.player.wellnesses[0].wellness_soreness > 2) {
			this.player.wellnesses[0].locations = [];
			this.resetBodyChartData();
		}
	}

	private resetBodyChartData() {
		this.bodyChart.resetAllData();
	}

	closeBodyDialog() {
		this.bodyDialogOpened = false;
	}

	saveSoreZones() {
		this.player.wellnesses[0].locations = [];
		const obKeys = Object.keys(this.bodyChart.zones);
		if (obKeys.length === 0) {
			this.closeBodyDialog();
			return;
		}
		obKeys.forEach(key => {
			this.player.wellnesses[0].locations.push(this.bodyChart.zones[key].id);
		});
		this.closeBodyDialog();
	}
}
