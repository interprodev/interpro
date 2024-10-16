import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';

const getHeaders = component => {
	const v = key => component.getDisplay(key) !== 'none';
	return [
		{ text: ' ', visible: v('pic') },
		...component.cols.map(col => ({ text: col.header, visible: v(col.field), align: col.align }))
	].filter(h => h.visible);
};

const getValues = component => {
	const { maintenance, admin, scouting, injuryIconService } = component;
	const v = key => component.getDisplay(key) !== 'none';
	const t = component.translate.instant.bind(component.translate);
	const f = (date, format = getMomentFormatFromStorage()) => (date ? moment(date).format(format) : '');
	const empty = { visible: false };
	return component.filtered.map(player => {
		const { icon, tooltip } = injuryIconService.parsePlayer(player);
		return {
			pic: { src: component.azurePipe.transform(player.downloadUrl), visible: v('pic') },
			displayName: { text: player.displayName, visible: v('displayName') },
			position: { text: player.position, visible: v('position') },
			birthDate: { text: f(player.birthDate, 'YYYY'), visible: v('birthDate') },
			nationality: { text: player.nationality, visible: v('nationality') },
			foot: !maintenance && !admin ? { text: t(player.foot || ' '), visible: v('foot') } : empty,
			readiness: !scouting && !admin ? { color: component.getReadinessColor(player), visible: v('readiness') } : empty,
			injury: !scouting && !admin ? { text: tooltip, icon, visible: v('injury') } : empty,
			status: maintenance ? { text: component.getInjuryStatus(player), icon, visible: v('status') } : empty,
			pending: maintenance
				? {
						// text1: component.getPreventionTitle(player.preventionPast),
						// text2: component.getPreventionTitle(player.preventionNext),
						icon1: player.preventionPast && 'fas fa-times',
						icon2: player.preventionNext && 'fas fa-clock',
						visible: v('pending')
				  }
				: empty,
			certificate: maintenance
				? {
						text: player.expiration ? player.expiration && component.getExpirationTitle(player) : ``,
						visible: v('certificate')
				  }
				: empty,
			contract: admin ? { text: component.getPlayerContractType(player), visible: v('contract') } : empty,
			from: admin ? { text: f(component.getFromDate(player)), visible: v('from') } : empty,
			to: admin ? { text: f(component.getToDate(player)), visible: v('to') } : empty,
			salary: admin ? { text: component.getSalary(player), visible: v('salary') } : empty,
			value: admin ? { text: component.getPlayerValue(player), visible: v('value') } : empty,
			archivedDate: component.isThereAnyArchivedPlayer(component.players)
				? { text: f(player.archivedDate, getMomentFormatFromStorage()), visible: v('archivedDate') }
				: empty,
			archivedMotivation: component.isThereAnyArchivedPlayer(component.players)
				? { text: component.getMotivation(player), visible: v('archivedMotivation') }
				: empty
		};
	});
};

const getData = component => {
	const headers = getHeaders(component);
	const values = getValues(component);
	return { headers, values };
};

export default getData;
