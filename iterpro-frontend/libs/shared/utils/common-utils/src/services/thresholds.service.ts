import { Injectable, Injector, inject } from '@angular/core';
import { Threshold } from '@iterpro/shared/data-access/sdk';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { CalendarService } from './calendar.service';

@Injectable({
	providedIn: 'root'
})
export class ThresholdsService extends EtlBaseInjectable {
	readonly DEFAULT_NAME = 'GD';
	readonly #calendarService = inject(CalendarService);

	constructor(injector: Injector) {
		super(injector);
		this.#calendarService = injector.get(CalendarService);
	}

	getGpsThresholdsForDate(date: Date, thresholdArray: any[]): Threshold[] {
		const dateString = this.#calendarService.getGD(date);
		let defaultThresh: Threshold[] = [];
		for (const obj of thresholdArray) {
			if (obj.name === this.DEFAULT_NAME) defaultThresh = obj.thresholds;
			if (dateString === obj.name) return obj.thresholds;
		}
		return defaultThresh.length > 0 ? defaultThresh : this.etlGpsService.getDefaultThresholds();
	}

	getGpsThresholdsForDayType(dateString: string, thresholdArray: any[]): Threshold[] {
		let defaultThresh: Threshold[] = [];
		for (const obj of thresholdArray) {
			if (obj.name === this.DEFAULT_NAME) defaultThresh = obj.thresholds;
			if (dateString === obj.name) return obj.thresholds;
		}

		return defaultThresh.length > 0 ? defaultThresh : this.etlGpsService.getDefaultThresholds();
	}

	hasGpsThresholdsForDayType(thresholdArray: any[], dateString?: string, date?: Date) {
		if (date) dateString = this.#calendarService.getGD(date);

		return !!thresholdArray && thresholdArray.some(x => x.name === dateString);
	}
}
