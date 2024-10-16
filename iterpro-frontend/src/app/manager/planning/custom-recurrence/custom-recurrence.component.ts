import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
	WEEKLY_DAYS,
	getDayLabelFromDate,
	getWeekOfMonth,
	getWordFromNumberUtil,
	weekdays
} from './utils/custom-recurrences.utils';

enum RepeatType {
	Days = 1,
	Weeks = 2,
	Months = 3,
	Years = 4
}

enum EndsType {
	Never = 1,
	On = 2,
	After = 3
}

export interface RecurrenceItem {
	count: number;
	repeatOn: RepeatType;
	weeklyDays: { key: weekdays; label: string; checked: boolean; index: number }[];
	monthlyType?: {
		onSpecificDay: {
			dayNumber: number;
			checked: boolean;
		};
		onSpecificDayAndWeek: {
			weekNumber: number;
			weekday: weekdays;
			checked: boolean;
		};
	};
	ends: {
		type: EndsType;
		onDay?: Date;
		afterOccurrencesCount?: number;
	};
}

@Component({
	selector: 'iterpro-custom-recurrence',
	templateUrl: './custom-recurrence.component.html',
	styleUrls: ['./custom-recurrence.component.scss']
})
export class CustomRecurrenceComponent implements OnInit {
	basicRepeatList: SelectItem[] = [
		{
			label: 'Days',
			value: RepeatType.Days
		},
		{
			label: 'Weeks',
			value: RepeatType.Weeks
		},
		{
			label: 'Months',
			value: RepeatType.Months
		},
		{
			label: 'Years',
			value: RepeatType.Years
		}
	];

	repeatOnTypes = RepeatType;
	endTypes = EndsType;
	customRecurrence: RecurrenceItem = {
		count: 1,
		repeatOn: RepeatType.Weeks,
		weeklyDays: WEEKLY_DAYS.map(a => ({ ...a, checked: false })),
		ends: {
			type: EndsType.Never
		}
	};

	editable = true;
	selectedDate: Date;
	minimumDate: Date;
	constructor(private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
		this.minimumDate = moment(this.selectedDate).add(1, 'days').toDate();
		if (config.data) {
			this.selectedDate = config.data.selectedDate;
			this.customRecurrence.weeklyDays.find(a => a.index === this.selectedDate.getDay()).checked = true;
		}
	}

	ngOnInit(): void {}

	onConfirm() {
		this.ref.close(this.customRecurrence);
	}

	onDiscard() {
		this.ref.close();
	}

	getMaxRepeatRecurrence(): number {
		switch (this.customRecurrence.repeatOn) {
			case RepeatType.Days:
				return 30;
			case RepeatType.Weeks:
				return 4;
			case RepeatType.Months:
				return 12;
			case RepeatType.Years:
				return 5;
			default:
				console.warn('the provided type is not supported');
		}
	}

	onCustomRecurrenceRepeatEveryChange(event: any) {
		const type = this.customRecurrence.repeatOn;
		if (this.customRecurrence.count > this.getMaxRepeatRecurrence()) {
			this.customRecurrence.count = this.getMaxRepeatRecurrence();
		}
		if (type === RepeatType.Months) {
			this.customRecurrence.monthlyType = {
				onSpecificDay: {
					dayNumber: this.selectedDate.getDate(),
					checked: false
				},
				onSpecificDayAndWeek: {
					weekNumber: getWeekOfMonth(moment(this.selectedDate)),
					weekday: getDayLabelFromDate(this.selectedDate),
					checked: false
				}
			};
		}
		if (type !== RepeatType.Weeks) {
			this.customRecurrence.weeklyDays.map(a => (a.checked = false));
		}
	}

	onEndTypeChange(event: any) {
		const type = this.customRecurrence.ends.type;
		if (type === EndsType.Never) {
			this.customRecurrence.ends.afterOccurrencesCount = null;
			this.customRecurrence.ends.onDay = null;
		}
		if (type === EndsType.On) {
			this.customRecurrence.ends.afterOccurrencesCount = null;
		}
		if (type === EndsType.After) {
			this.customRecurrence.ends.onDay = null;
		}
	}

	getSaveEnabled(): boolean {
		return true;
	}

	getWordFromNumber(weekNumber: number): string {
		return getWordFromNumberUtil(weekNumber);
	}
}
