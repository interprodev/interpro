import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DurationInput } from '@fullcalendar/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerTeamSettings,
	CustomerTeamSettingsApi,
	LoopBackAuth
} from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService, ErrorService, getTeamSettings } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { TimepickerComponent } from '@iterpro/shared/ui/components';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModule, TranslateModule, TimepickerComponent],
	selector: 'iterpro-calendar-time-range-setting',
	templateUrl: './calendar-time-range-setting.component.html',
	styleUrls: ['./calendar-time-range-setting.component.scss']
})
export class CalendarTimeRangeSettingComponent implements OnInit {
	@Input({required: true}) calendarId: CalendarId;
	@Input({required: true}) slotMinTime: DurationInput; // from calendar options
	@Input({required: true}) slotMaxTime: DurationInput;
	@Output() slotMinTimeChange: EventEmitter<string> = new EventEmitter<string>();
	@Output() slotMaxTimeChange: EventEmitter<string> = new EventEmitter<string>();
	hasTargetTimeRangeSetting: boolean;
	currentUser: Customer;
	currentTeamSettings: CustomerTeamSettings;
	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		private customerTeamSettingsApi: CustomerTeamSettingsApi,
		private currentTeamService: CurrentTeamService,
		private notificationService: AlertService
	) {}

	ngOnInit(): void {
		if (!this.calendarId) {
			console.error('calendarId is required');
		}
		this.currentUser = this.auth.getCurrentUserData();
		const currentTeam = this.currentTeamService.getCurrentTeam();
		this.currentTeamSettings = getTeamSettings(this.currentUser.teamSettings, currentTeam.id);
		this.loadCalendarSetting();
	}

	//#region Calendar Settings
	private loadCalendarSetting() {
		const calendarSettings: UserCalendarSettings = this.currentTeamSettings?.calendarSettings as UserCalendarSettings;
		if (calendarSettings?.timeRange?.length > 0) {
			const targetTimeRangeSetting = calendarSettings.timeRange.find(
				({ calendarId }) => calendarId === this.calendarId
			);
			if (targetTimeRangeSetting) {
				this.slotMinTimeChange.emit(targetTimeRangeSetting.startTime);
				this.slotMaxTimeChange.emit(targetTimeRangeSetting.endTime);
				this.hasTargetTimeRangeSetting = true;
			}
		}
	}

	pinClicked() {
		if (this.hasTargetTimeRangeSetting) {
			this.removeTimeRangeSetting();
		} else {
			this.saveTimeRangeSetting();
		}
	}

	private saveTimeRangeSetting() {
		const otherTimeRangeSettings = (
			(this.currentTeamSettings?.calendarSettings as UserCalendarSettings)?.timeRange || []
		)?.filter(({ calendarId }) => calendarId !== this.calendarId);
		const updatedCalendarSettings: UserCalendarSettings = {
			...(this.currentTeamSettings?.calendarSettings as UserCalendarSettings),
			timeRange: [
				...otherTimeRangeSettings,
				{
					calendarId: this.calendarId,
					startTime: this.slotMinTime as string,
					endTime: this.slotMaxTime as string
				}
			]
		};
		this.updateCustomerTeamSettings(updatedCalendarSettings);
	}

	private removeTimeRangeSetting() {
		this.slotMinTimeChange.emit('00:00');
		this.slotMaxTimeChange.emit('24:00');
		const otherTimeRangeSettings = (
			(this.currentTeamSettings?.calendarSettings as UserCalendarSettings)?.timeRange || []
		)?.filter(({ calendarId }) => calendarId !== this.calendarId);
		const updatedCalendarSettings: UserCalendarSettings = {
			...(this.currentTeamSettings?.calendarSettings as UserCalendarSettings),
			timeRange: otherTimeRangeSettings
		};
		this.updateCustomerTeamSettings(updatedCalendarSettings, true);
	}

	private updateCustomerTeamSettings(calendarSettings: UserCalendarSettings, isReset = false) {
		this.customerTeamSettingsApi
			.patchAttributes(this.currentTeamSettings.id, <CustomerTeamSettings> {
				calendarSettings
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (updatedCustomerTeamSettings: CustomerTeamSettings) => {
					this.hasTargetTimeRangeSetting = !isReset;
					this.setCurrentUserTeamSettings(this.currentUser, updatedCustomerTeamSettings);
					this.notificationService.notify('success', 'Planning', 'alert.recordUpdated');
				},
				error: err => this.error.handleError(err)
			});
	}

	private setCurrentUserTeamSettings(user: Customer, updatedCustomerTeamSettings: CustomerTeamSettings) {
		this.auth.setUser({
			...user,
			teamSettings: user.teamSettings.map((info: CustomerTeamSettings) => {
				if (info.teamId === user.currentTeamId) {
					return updatedCustomerTeamSettings;
				}
				return info;
			})
		});
	}

	//#endregion
}

export type CalendarId = 'planning' | 'maintenance' | 'scouting';
export interface UserCalendarSettings {
	timeRange: {
		calendarId: CalendarId;
		startTime: string; // HH:mm
		endTime: string; // HH:mm
	}[];
}
