import { PlayerScouting } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment/moment';

export const mapThirdPartyPlayerToPlayerScouting = (
	thirdPartyPlayer: any,
	clubId: string,
	currentTeamId: string,
	teamName: string
): PlayerScouting | null => {
	if (!thirdPartyPlayer) return null;
	return new PlayerScouting({
		wyscoutId: thirdPartyPlayer?.wyId,
		instatId: thirdPartyPlayer?.instId,
		archived: false,
		clubId,
		teamId: currentTeamId,
		currentTeam: thirdPartyPlayer?.currentTeam ? thirdPartyPlayer.currentTeam.name : teamName,
		downloadUrl: thirdPartyPlayer?.img || thirdPartyPlayer?.imageDataURL,
		name: thirdPartyPlayer.firstName,
		lastName: thirdPartyPlayer.lastName,
		displayName: thirdPartyPlayer.shortName,
		birthDate: thirdPartyPlayer.birthDate,
		nationality: thirdPartyPlayer.birthArea?.alpha2code,
		altNationality: thirdPartyPlayer?.passport ? thirdPartyPlayer.passport.alpha2code : null,
		foot: thirdPartyPlayer.foot,
		gender: thirdPartyPlayer.gender,
		height: thirdPartyPlayer.height,
		weight: thirdPartyPlayer.weight,
		position: thirdPartyPlayer.role?.code2,
		value: thirdPartyPlayer.transferValue,
		valueField: 'value',
		federalMembership: [],
		_statusHistory: [],
		currentStatus: 'inTeam',
		observed: false,
		address: {
			street: '',
			city: '',
			zipCode: '',
			state: '',
			nation: ''
		},
		domicile: {
			street: '',
			city: '',
			zipCode: '',
			state: '',
			nation: ''
		},
		contractDetails: {
			agent: '',
			agentPhone: '',
			agentEmail: '',
			owner: '',
			currentlyPlaying: '',
			league: '',
			nation: '',
			contractType: '',
			wage: '',
			dateTo: null,
			marketValue: ''
		},
		recommended: 0
	});
};

export function getGameDurationString(startTime: string, endTime: string): string | undefined {
	let durationString;
	if (endTime) {
		let duration = moment(endTime, 'HH:mm').diff(moment(startTime, 'HH:mm'));
		if (duration) {
			if (duration < 0) {
				duration =
					moment('24:00:', 'HH:mm').diff(moment(startTime, 'HH:mm')) +
					moment(endTime, 'HH:mm').diff(moment('00:00', 'HH:mm'));
			}
			durationString = moment.duration(duration).asMinutes() + '';
		}
	}
	return durationString;
}
