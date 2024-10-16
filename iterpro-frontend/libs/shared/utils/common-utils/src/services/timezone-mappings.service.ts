import { Injectable } from '@angular/core';

export interface TimezoneDescriptorInterface {
	id: string;
	label: string;
	timezoneLabel: string;
	timezoneValue: number;
}

export class TimezoneDescriptor implements TimezoneDescriptorInterface {
	id!: string;
	label!: string;
	timezoneLabel!: string;
	timezoneValue!: number;

	constructor(data?: TimezoneDescriptorInterface) {
		Object.assign(this, data);
	}
}

@Injectable({
	providedIn: 'root'
})
export class TimezoneMappingsService {
	timezoneList: Array<TimezoneDescriptor>;

	constructor() {
		this.timezoneList = new Array<TimezoneDescriptor>();

		this.timezoneList.push(
			new TimezoneDescriptor({
				id: '1',
				label: '(GMT-12:00)',
				timezoneLabel: 'International Date Line West',
				timezoneValue: -12
			})
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '2', label: '(GMT-11:00)', timezoneLabel: 'Pacific/Midway', timezoneValue: -11 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '3', label: '(GMT-10:00)', timezoneLabel: 'Pacific/Honolulu', timezoneValue: -10 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '4', label: '(GMT-09:00)', timezoneLabel: 'America/Anchorage', timezoneValue: -9 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '5', label: '(GMT-08:00)', timezoneLabel: 'America/Los_Angeles', timezoneValue: -8 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '6', label: '(GMT-07:00)', timezoneLabel: 'America/Phoenix', timezoneValue: -7 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '7', label: '(GMT-06:00)', timezoneLabel: 'America/Chicago', timezoneValue: -6 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '8', label: '(GMT-05:00)', timezoneLabel: 'America/New_York', timezoneValue: -5 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '9', label: '(GMT-04:00)', timezoneLabel: 'Atlantic/Canary', timezoneValue: -4 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({
				id: '10',
				label: '(GMT-03:00)',
				timezoneLabel: 'America/Argentina/Buenos_Aires',
				timezoneValue: -3
			})
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '11', label: '(GMT-02:00)', timezoneLabel: 'Mid Atlantic', timezoneValue: -2 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({
				id: '12',
				label: '(GMT-01:00)',
				timezoneLabel: 'Atlantic/Cape_Verde',
				timezoneValue: -1
			})
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '13', label: '(GMT+00:00)', timezoneLabel: 'Europe/London', timezoneValue: 0 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '14', label: '(GMT+01:00)', timezoneLabel: 'Europe/Amsterdam', timezoneValue: 1 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '15', label: '(GMT+02:00)', timezoneLabel: 'Europe/Athens', timezoneValue: 2 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '16', label: '(GMT+03:00)', timezoneLabel: 'Europe/Moscow', timezoneValue: 3 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '17', label: '(GMT+04:00)', timezoneLabel: 'Asia/Muscat', timezoneValue: 4 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '18', label: '(GMT+05:00)', timezoneLabel: 'Asia/Yekaterinburg', timezoneValue: 5 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '19', label: '(GMT+06:00)', timezoneLabel: 'Asia/Almaty', timezoneValue: 6 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '20', label: '(GMT+07:00)', timezoneLabel: 'Asia/Bangkok', timezoneValue: 7 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '21', label: '(GMT+08:00)', timezoneLabel: 'Asia/Hong_Kong', timezoneValue: 8 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '22', label: '(GMT+09:00)', timezoneLabel: 'Asia/Tokyo', timezoneValue: 9 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '23', label: '(GMT+10:00)', timezoneLabel: 'Australia/Brisbane', timezoneValue: 10 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '24', label: '(GMT+11:00)', timezoneLabel: 'Asia/Magadan', timezoneValue: 11 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '25', label: '(GMT+12:00)', timezoneLabel: 'Pacific/Auckland', timezoneValue: 12 })
		);
		this.timezoneList.push(
			new TimezoneDescriptor({ id: '26', label: '(GMT+13:00)', timezoneLabel: 'Pacific/Tongatapu', timezoneValue: 13 })
		);
	}

	public getTimezoneWithId(id: string): TimezoneDescriptor | undefined {
		return this.timezoneList.find(x => x.id === id);
	}

	public getTimezoneWithValue(numberValue: number): TimezoneDescriptor | undefined {
		return this.timezoneList.find(x => x.timezoneValue === numberValue);
	}

	public getTimezoneList(): Array<TimezoneDescriptor> {
		return this.timezoneList;
	}
}
