import { Pipe, PipeTransform } from '@angular/core';
import { Notification } from '@iterpro/shared/data-access/sdk';

@Pipe({
	standalone: true,
	name: 'notificationIconClass'
})
export class NotificationIconClassPipe implements PipeTransform {
	transform({ type, subtype }: Notification): string {
		switch (type) {
			case 'scouting':
				return subtype && subtype === 'scoutingMessage' ? 'fas fa-comment-alt' : 'fas fa-exclamation-triangle';
			case 'session':
			case 'workloadScore':
				return 'fas fa-bullseye-arrow';
			case 'readiness':
			case 'ewma':
				return 'fas fa-exclamation-triangle';
			case 'injury':
				return 'fas fa-ambulance';
			case 'rehab':
				return 'fas fa-user-md';
			case 'import-data':
				return 'fas fa-cloud-upload';
			case 'clinicalRecords':
				return 'fas fa-calendar-times';
			case 'contractAppearanceFee':
			case 'contractPerformanceFee':
			case 'appearanceBonus':
			case 'performanceBonus':
			case 'standardTeamBonus':
			case 'signingBonus':
			case 'customBonus':
			case 'valorization':
			case 'bonusPaidOverdue':
			case 'contractExpiration':
			case 'costItemExpiration':
			case 'documentExpiration':
			case 'playerOperation':
			case 'transferOperation':
			case 'clubBonus':
			case 'clubBonusPaidOverdue':
			case 'financialCapitalLossGain':
			case 'financialCapitalGain':
			case 'roi':
			case 'losses':
			case 'installment':
			case 'contractNotify':
				return 'fas fa-hand-holding-usd';
			case 'playerVideoComment':
			case 'videoComment':
				return 'fas fa-comment-alt';
			case 'videoSharing':
				return 'fas fa-video';
			case 'invitation':
			case 'eventReminder':
			case 'eventUpdate':
			case 'scoutingGameReminder':
			case 'scoutingGameInvitation':
				return 'fas fa-calendar';
			default:
				return 'fas fa-bell';
		}
	}
}
