import { Injectable, inject } from '@angular/core';
import { Injury, Player } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { getMomentFormatFromStorage } from '../../utils/dates/date-format.util';
import { AvailabiltyService } from '../manager/availabilty.service';

const healthIcons = {
	notAvailable: 'fas fa-ambulance bordered-red',
	careful: 'fas fa-exclamation-triangle bordered-yellow',
	injury: 'fas fa-band-aid',
	complaint: 'fas fa-frown',
	illness: 'fas fa-thermometer-three-quarters',
	fit: ''
};
export type HealthStatus = 'notAvailable' | 'careful' | 'injury' | 'complaint' | 'illness' | 'fit';
export interface Availability {
	available: 'yes' | 'no' | 'careful';
	expectation?: any;
	further?: any;
}

@Injectable({
	providedIn: 'root'
})
export class InjuryIconService {
	readonly #translateService = inject(TranslateService);
	readonly #availabilityService = inject(AvailabiltyService);

	public parseInjury(injury: Injury, period: Date) {
		const status = this.getInjuryStatus([injury], period);
		const tooltip = this.getInjuryTooltip([injury], status, period);
		const icon = healthIcons[status];
		return { tooltip, icon };
	}

	public parsePlayer(player: Player, period: Date) {
		const status = this.getHealthStatus(player.injuries, period);
		const tooltip = this.getInjuryTooltip(player.injuries, status, period);
		const icon = healthIcons[status];
		return { tooltip, icon };
	}

	private getInjuryTooltip(injuries: Injury[] = [], status: HealthStatus, period: Date) {
		const filtered = injuries
			.filter(({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed')
			.filter(injury => !!injury.location);
		const assessment = this.getAssessmentInfo(filtered, period);
		const locations = filtered.map(injury => this.#translateService.instant(injury.location));
		const osics = filtered.map(({ osics }) => osics || ``);
		const tooltip = `<ul><li>${this.translateStatus(status)}</li><li>${this.translateStatus(
			this.getIssueType(filtered)
		)} - ${locations.length > 0 ? locations.join(', ') : ''}</li><li>${
			osics.length > 0 ? osics.join(', ') : ''
		}</li><li>${assessment}</li></ul>`;
		return tooltip;
	}
	private getAssessmentInfo(injuries: Injury[], period: Date) {
		const { expectation, further } = this.#availabilityService.getAvailability(
			injuries.filter(({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed'),
			period
		);
		const assessment = further
			? this.#translateService.instant('medical.infirmary.assessments.further')
			: expectation
			? moment(expectation).format(getMomentFormatFromStorage())
			: '';
		return assessment;
	}

	public getHealthStatus(injuries: Injury[], period?: Date): HealthStatus {
		const filtered = injuries.filter(
			({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed'
		);
		return this.getInjuryStatus(filtered, period as Date);
	}

	private getInjuryStatus(injuries: Injury[], period: Date): HealthStatus {
		const { available } = this.#availabilityService.getAvailability(injuries, period);
		if (available === 'no') return 'notAvailable';
		else if (available === 'careful') return 'careful';
		else return this.getIssueType(injuries);
	}

	private getIssueType(injuries: Injury[]): HealthStatus {
		if (injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.injury')) return 'injury';
		if (injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.illness')) return 'illness';
		if (injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.complaint')) return 'complaint';
		return 'fit';
	}

	private translateStatus(status: HealthStatus) {
		switch (status) {
			case 'notAvailable': {
				return this.#translateService.instant('tooltip.notAvailable');
			}
			case 'careful': {
				return this.#translateService.instant('tooltip.beCareful');
			}
			case 'injury': {
				return this.#translateService.instant('tooltip.injured');
			}
			case 'complaint': {
				return this.#translateService.instant('tooltip.complaint');
			}
			case 'illness': {
				return this.#translateService.instant('tooltip.illness');
			}
		}
		return '';
	}
}
