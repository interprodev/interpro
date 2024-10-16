import {
	CHRONIC_STATUS_FLARED,
	CHRONIC_STATUS_HEALED,
	CHRONIC_STATUS_STABLE,
	getMomentFormatFromStorage
} from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';

export const STATUS_INJURY = 'STATUS_INJURY';
export const STATUS_CLOSED = 'STATUS_CLOSED';
export const STATUS_CHRONIC = 'STATUS_CHRONIC';
export const STATUS_COMPLAINT = 'STATUS_COMPLAINT';
export const STATUS_NONE = 'STATUS_NONE';
export const STATUS_SORENESS = 'STATUS_SORENESS';

export const ISSUE_INJURY = 'medical.infirmary.details.issue.injury';
export const ISSUE_COMPLAINT = 'medical.infirmary.details.issue.complaint';
export const CHRONIC_HEALED = 'medical.prevention.chronic.healed';
export const ISSUE_SORENESS = 'medical.infirmary.details.issue.soreness';

/*
casi:
  - infortunio/complaint chiuso da più di 60gg o cronico chiuso => NIENTE
  - infortunio/complaint chiuso da meno di 60gg => GRIGIO CHIARO
  - complaint aperto => GIALLO
  - cronico aperto => ARANCIO
  - infortunio aperto => ROSSO
  - soreness => BLU
*/

export const fillColors = {
	[STATUS_INJURY]: '#c1272d',
	[STATUS_COMPLAINT]: '#fcee21',
	[STATUS_CHRONIC]: '#f15a24',
	[STATUS_CLOSED]: '#6f6f6f',
	[STATUS_NONE]: '#4c4c4c',
	[STATUS_SORENESS]: 'url(#sorenessPattern)'
};

export const sorenessPattern = {
	[STATUS_INJURY]: 'url(#sorenessInjuryPattern)',
	[STATUS_COMPLAINT]: 'url(#sorenessComplaintPattern)',
	[STATUS_CHRONIC]: 'url(#sorenessChronicPattern)',
	[STATUS_CLOSED]: 'url(#sorenessClosedPattern)'
};

export default class InjuryZone {
	translate: any = null;
	status: string = STATUS_NONE;
	id = '';
	injuries: any = [];
	color: string = fillColors[STATUS_NONE];
	mainInjury: any = null;
	label = '';
	pointsLabel = '';

	constructor(location) {
		this.id = location.split('.').pop();
		this.id = this.id.replace(/\s/g, '_');
		this.id = this.id.replace(/\//g, '_');
	}

	addInjury(injury, isChronic = false, hidePast = true) {
		this.injuries.push(injury);
		this.updateMainInjury(injury);
		if (this.shouldChangeToClosed(injury, hidePast)) {
			this.status = STATUS_CLOSED;
			this.updateMainInjury(injury);
		} else if (this.shouldChangeToInjury(injury, hidePast)) {
			this.status = STATUS_INJURY;
			this.updateMainInjury(injury);
		} else if (isChronic && this.shouldChangeToChronic(injury)) {
			this.status = STATUS_CHRONIC;
			this.updateMainInjury(injury);
		} else if (this.shouldChangeToComplaint(injury, hidePast)) {
			this.status = STATUS_COMPLAINT;
			this.updateMainInjury(injury);
		} else if (this.shouldChangeToSoreness(injury)) {
			this.status = STATUS_SORENESS;
			this.updateMainInjury(injury);
		} else {
			console.warn('No status for current injury');
		}
		this.updatePointsLabel();
		this.updateColor();
	}

	updateMainInjury(injury) {
		this.mainInjury = injury;
		this.updateLabel();
	}

	isMoreRecent(injury) {
		if (!this.mainInjury.date && injury.date) return true;
		if (!injury.date) return false;
		return moment(this.mainInjury.date) < moment(injury.date);
	}

	private shouldChangeToChronic(injury): boolean {
		return injury.currentStatus !== CHRONIC_HEALED && this.status !== STATUS_CHRONIC && this.status !== STATUS_INJURY;
	}

	private shouldChangeToComplaint(injury, hidePast = true): boolean {
		return (
			injury.issue === ISSUE_COMPLAINT &&
			this.status !== STATUS_INJURY &&
			this.status !== STATUS_CHRONIC &&
			(!hidePast || !injury.endDate)
		);
	}

	private shouldChangeToInjury(injury, hidePast = true): boolean {
		return injury.issue === ISSUE_INJURY && (!hidePast || !injury.endDate);
	}

	private shouldChangeToSoreness(injury): boolean {
		return injury.issue === ISSUE_SORENESS;
	}

	private shouldChangeToClosed(injury, hidePast = true): boolean {
		return (
			this.status !== STATUS_INJURY &&
			this.status !== STATUS_CHRONIC &&
			this.status !== STATUS_COMPLAINT &&
			hidePast &&
			injury.endDate &&
			isInjuryStatusClosed(injury.endDate)
		);
	}

	private updateColor() {
		this.color = fillColors[this.status];
	}

	updateSorenessStatusColor(status: string) {
		this.color = sorenessPattern[status];
	}

	toPoint(points) {
		if (points[this.id]) {
			return {
				point: points[this.id],
				value: this.injuries.filter(
					x =>
						x.location.split('.').pop() === this.id &&
						(x.issue ||
							(x.currentStatus && x.currentStatus === CHRONIC_STATUS_HEALED) ||
							x.currentStatus === CHRONIC_STATUS_FLARED ||
							x.currentStatus === CHRONIC_STATUS_STABLE)
				).length
			};
		}
		return null;
	}

	private updateLabel() {
		const t = this.translate.instant.bind(this.translate);
		this.label = '';
		this.pointsLabel = '';

		this.label = `${moment(this.mainInjury.date).format(getMomentFormatFromStorage())} - ${this.translate.instant(
			this.mainInjury.location
		)}${this.mainInjury.osics ? ` - ${this.mainInjury.osics}` : ``}`;

		if (this.mainInjury.issue) {
			this.label = `${this.label} - ${t(this.mainInjury.issue)}`;
			if (this.status !== STATUS_CHRONIC) {
				this.label = `${this.label} - ${t(this.mainInjury.currentStatus)}`;
			} else {
				this.label = `${this.label} - ${t('chronicInjuries.chronicIssue')}`;
			}
		}
	}

	private updatePointsLabel() {
		const injuries = this.injuries.filter(
			i => i.issue && i.issue === ISSUE_INJURY && !isInjuryStatusClosed(i.endDate)
		).length;
		const closedInjuries = this.injuries.filter(
			i => i.issue && i.issue === ISSUE_INJURY && isInjuryStatusClosed(i.endDate)
		).length;
		const complaints = this.injuries.filter(
			i => i.issue && i.issue === ISSUE_COMPLAINT && !isInjuryStatusClosed(i.endDate)
		).length;
		const closedComplaints = this.injuries.filter(
			i => i.issue && i.issue === ISSUE_COMPLAINT && isInjuryStatusClosed(i.endDate)
		).length;
		const soreness = this.injuries.filter(i => i.issue && i.issue === ISSUE_SORENESS).length;
		const chronic = this.injuries.filter(
			i =>
				(i.currentStatus && i.currentStatus === CHRONIC_STATUS_HEALED) ||
				i.currentStatus === CHRONIC_STATUS_FLARED ||
				i.currentStatus === CHRONIC_STATUS_STABLE
		).length;

		const labels: string[] = [];
		if (injuries)
			labels.push(`${Math.round((injuries / this.injuries.length) * 100)}% ${this.translate.instant(ISSUE_INJURY)}`);
		if (closedInjuries)
			labels.push(
				`${Math.round((closedInjuries / this.injuries.length) * 100)}% ${this.translate.instant(
					ISSUE_INJURY
				)}/${this.translate.instant('Closed')}`
			);
		if (complaints)
			labels.push(
				`${Math.round((complaints / this.injuries.length) * 100)}% ${this.translate.instant(ISSUE_COMPLAINT)}`
			);
		if (closedComplaints)
			labels.push(
				`${Math.round((closedComplaints / this.injuries.length) * 100)}% ${this.translate.instant(
					ISSUE_COMPLAINT
				)}/${this.translate.instant('Closed')}`
			);
		if (soreness)
			labels.push(`${Math.round((soreness / this.injuries.length) * 100)}% ${this.translate.instant(ISSUE_SORENESS)}`);
		if (chronic)
			labels.push(
				`${Math.round((chronic / this.injuries.length) * 100)}% ${this.translate.instant(
					'chronicInjuries.chronicIssue'
				)}`
			);

		this.pointsLabel = labels.join(', ');
	}
}

export function isInjuryStatusClosed(endDate: Date): boolean {
	// the injury has ended from LESS than 60 days
	return endDate && moment().diff(moment(endDate), 'days') < 60;
}

export function isInjuryArchived(endDate: Date): boolean {
	// the injury has ended from MORE than 60 days
	return endDate && moment().diff(moment(endDate), 'days') >= 60;
}
