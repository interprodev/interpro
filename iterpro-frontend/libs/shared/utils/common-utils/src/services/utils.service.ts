import { Customer, CustomerTeamSettings, Player, Team } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { getTeamSettings } from '../utils/functions/user/user.functions';

export const getTooltipPermissions = (
	customer: Customer,
	team: Team,
	translateService: TranslateService,
	group: string[] = []
) => {
	const permissions = (getTeamSettings(customer.teamSettings, team.id) as CustomerTeamSettings).permissions;
	const text = `<ul>${permissions
		.map((x: any) => `<li>${group.includes(x) ? '' : '•'} ${translateService.instant(x)}</li>`)
		.join('')}</ul>`;
	return text;
};

export const getExtensionOfFileFromUrl = (url: string): string => {
	// Remove everything to the last slash in orl
	if (url != null && url) {
		// This will return name of file with it's extension.
		let extn: string = url.substr(1 + url.lastIndexOf('/'));
		extn = extn.split('.')[1];

		return extn;
	}

	return '';
};

export const isActiveAtDate = (player: Player, date: Date) =>
	player && (!player.archived || (player.archived && moment(player.archivedDate).isAfter(moment(date), 'day')));
export const isNotArchived = (player: Player, session: any) => isActiveAtDate(player, session.date);
export const clearCircularJSON = data => {
	if (data) {
		data.datasets.forEach(d => {
			if (d['_meta']) delete d['_meta'];
		});
	}
	return data;
};
export const clearAndCopyCircularJSON = (data: any) =>
	data
		? {
				...data,
				datasets: data.datasets.map((d: any) => {
					const dNoMeta = { ...d };
					if (dNoMeta['_meta']) delete dNoMeta['_meta'];
					return dNoMeta;
				})
		  }
		: data;

export const getPlayerValue = (player: any) => {
	return player.valueField ? player[player.valueField] : player.value;
};

export const getPlayersById = (ids: string[], players: Player[]) => ids.map(x => players.find(pl => pl.id === x));
export const isGroup = (players: Player[]) => players && Array.isArray(players);

export const getPlayerPastValues = (player: any) => {
	if (!player.valueField || player.valueField === 'value') return player._pastValues || [];
	else if (player.valueField === 'clubValue') return player._pastClubValues || [];
	else if (player.valueField === 'agentValue') return player._pastAgentValues || [];
	else if (player.valueField === 'transfermarktValue') return player._pastTransfermarktValues || [];
};

export const insertPlayerPastValues = (player: any, values: any) => {
	if (!player.valueField || player.valueField === 'value') player._pastValues = values;
	else if (player.valueField === 'clubValue') player._pastClubValues = values;
	else if (player.valueField === 'agentValue') player._pastAgentValues = values;
	else if (player.valueField === 'transfermarktValue') player._pastTransfermarktValues = values;
	return player;
};

export const convertToString = val => (!val || val === undefined || val === null ? '' : val.toString());

export const workloadLabels = (value: number, translateService: TranslateService) => {
	if (value <= 1) return translateService.instant('event.effort.1');
	else if (value === 2) return translateService.instant('event.effort.2');
	else if (value === 3) return translateService.instant('event.effort.3');
	else if (value === 4) return translateService.instant('event.effort.4');
	else if (value === 5) return translateService.instant('event.effort.5');
	else if (value >= 6) return translateService.instant('event.effort.6');
	else return '';
};

export const capitalize = (txt: string) =>
	!txt ? txt : txt.replace(/\w\S*/g, (word: string) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
