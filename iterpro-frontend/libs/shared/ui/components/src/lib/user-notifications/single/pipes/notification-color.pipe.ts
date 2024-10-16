import { Pipe, PipeTransform } from '@angular/core';
import { Notification } from '@iterpro/shared/data-access/sdk';

@Pipe({
	standalone: true,
	name: 'notificationColor'
})
export class NotificationColorPipe implements PipeTransform {
	transform({ type }: Notification): string {
		switch (type) {
			case 'session':
			case 'workloadScore':
			case 'import-data':
			case 'scouting':
			case 'invitation':
			case 'eventReminder':
			case 'eventUpdate':
			case 'scoutingGameReminder':
			case 'playerVideoComment':
			case 'videoComment':
			case 'videoSharing':
			case 'scoutingGameInvitation':
				return 'lightblue';
			case 'readiness':
			case 'ewma':
			case 'clinicalRecords':
			case 'financialCapitalLossGain':
				return 'yellow';
			case 'injury':
				return 'red';
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
			case 'financialCapitalGain':
			case 'roi':
			case 'losses':
			case 'installment':
			case 'contractNotify':
				return 'green';
			default:
				return 'gray';
		}
	}
}
