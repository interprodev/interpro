import { Pipe, PipeTransform } from '@angular/core';
import { Notification } from '@iterpro/shared/data-access/sdk';

@Pipe({
	standalone: true,
	name: 'notificationLink'
})
export class NotificationLinkPipe implements PipeTransform {
	transform(notification: Notification): [string, object?] {
		switch (notification.type) {
			case 'playerVideoComment':
				return [
					'/manager/video-gallery',
					{
						teamId: notification.teamId,
						playerId: notification.playerId,
						videoId: notification.videoId,
						matchId: notification.matchId
					}
				];
			case 'videoSharing':
			case 'videoComment':
				return [
					'/manager/video-gallery',
					{
						teamId: notification.teamId,
						videoId: notification.videoId
					}
				];
			case 'scouting':
				return [
					'/players/scouting',
					{
						teamId: notification.teamId,
						playerId: notification.playerId
					}
				];
			case 'scoutingGameReportCompletion':
			case 'scoutingGameReminder':
			case 'scoutingGameInvitation':
				return [
					'/players/scouting',
					{
						teamId: notification.teamId,
						gameId: notification.scoutingGameId
					}
				];
			case 'session':
			case 'import':
				return [
					'/performance/session-analysis',
					{
						teamId: notification.teamId,
						metric: notification.metrics || null,
						date: notification.date,
						session_id: notification.eventId
					}
				];
			case 'workloadScore':
				return [
					'/performance/workload-analysis',
					{
						id: notification.eventId
					}
				];
			case 'readiness':
				return [
					'/performance/readiness',
					{
						teamId: notification.teamId,
						date: notification.date,
						id: notification.playerId
					}
				];
			case 'ewma':
				return [
					'/performance/session-analysis',
					{
						ewma: true,
						teamId: notification.teamId,
						date: notification.date,
						player_id: notification.playerId
					}
				];
			case 'injury':
				return [
					'/performance/readiness',
					{
						teamId: notification.teamId,
						id: notification.playerId || null,
						date: notification.date
					}
				];
			case 'rehab':
				return [
					'/medical/infirmary',
					{
						teamId: notification.teamId
					}
				];
			case 'import-data':
				return [
					'/import-data',
					{
						teamId: notification.teamId
					}
				];
			case 'clinicalRecords':
				return [
					'/medical/maintenance',
					{
						teamId: notification.teamId,
						id: notification.anamnesysId,
						playerId: notification.playerId
					}
				];
			case 'contractExpiration':

			case 'documentExpiration':
			case 'playerOperation':
			case 'financialCapitalLossGain':
			case 'financialCapitalGain':
			case 'contractNotify':
			case 'roi':
			case 'losses':
				return [
					'/administration/squads',
					{
						teamId: notification.teamId,
						playerId: notification.playerId
					}
				];
			case 'costItemExpiration':
			case 'installment':
				return [
					'/administration/squads',
					{
						teamId: notification.teamId,
						[notification.playerId ? 'playerId' : 'staffId']: notification.playerId || notification.staffId,
						tabIndex: notification.type === 'costItemExpiration' ? (notification.playerId ? 5 : 2) : 1
					}
				];
			case 'transferOperation':
				return [
					'/players/transfers',
					{
						teamId: notification.teamId
					}
				];
			case 'clubBonus':
			case 'clubBonusPaidOverdue':
			case 'bonusPaidOverdue':
			case 'contractAppearanceFee':
			case 'contractPerformanceFee':
			case 'appearanceBonus':
			case 'performanceBonus':
			case 'standardTeamBonus':
			case 'signingBonus':
			case 'customBonus':
			case 'valorization':
				return [
					'/administration/finance/bonus',
					{
						teamId: notification.teamId
					}
				];
			case 'invitation':
			case 'eventReminder':
			case 'eventUpdate':
				return [
					'/manager/planning',
					{
						teamId: notification.teamId,
						id: notification.eventId
					}
				];
			default:
				return ['#'];
		}
	}
}
