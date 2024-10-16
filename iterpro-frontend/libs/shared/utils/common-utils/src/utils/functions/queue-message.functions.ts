import { Player, ResultWithQueueMessage } from '@iterpro/shared/data-access/sdk';
import { SHOW_QUEUE_PLAYER_RECALCULATION_ALERTS } from '../../constants/features-flag.constants';
import { AlertParams, AlertService } from '../../services/alert.service';

export const handleQueuePlayerRecalculationAlerts = (
	players: Player[],
	result: ResultWithQueueMessage,
	alertService: AlertService
) => {
	if (!SHOW_QUEUE_PLAYER_RECALCULATION_ALERTS) return;
	if (result?.message && result?.message.length > 0) {
		const alerts = result.message
			.filter(item => !!item)
			.filter(({ playerIds }) => playerIds && playerIds.length > 0)
			.map(message => {
				return <AlertParams>{
					severity: 'info',
					summary: message.title + ' - Recalculation requested for players: ',
					detail: message.playerIds?.map(plId => players.find(({ id }) => plId === id)?.displayName).join(', ')
				};
			});
		if (alerts && alerts.length > 0) {
			alertService.notifyAll(alerts);
		}
	}
};
