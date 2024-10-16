import { GOScore, InjuryAvailability, Player } from '@iterpro/shared/data-access/sdk';
import { AvailabiltyService } from '@iterpro/shared/utils/common-utils';

export const playerNotAvailable = (injuryMapObj: Map<string, any>, player: Player): boolean => {
	if (injuryMapObj && player) {
		const stateInj = injuryMapObj.get(player.displayName);
		if (stateInj) return stateInj.available === InjuryAvailability.NotAvailable;
		else return false;
	} else return false;
};

export const playerInjured = (injuryMapObj: Map<string, any>, player: Player): boolean => {
	if (injuryMapObj && player) {
		const stateInj = injuryMapObj.get(player.displayName);
		if (stateInj && stateInj.healthStatus && stateInj.available === 0) return true;
		else return false;
	}
};

export const playerBeCareful = (injuryMapObj: Map<string, any>, player: Player): boolean => {
	if (injuryMapObj && player) {
		const stateInj = injuryMapObj.get(player.displayName);
		if (stateInj) return stateInj.available === InjuryAvailability.BeCareful;
		else return false;
	} else return false;
};

export const getInjuryIcon = (injuryMapObj: Map<string, any>, player: Player): string => {
	if (injuryMapObj && player) {
		const stateInj = injuryMapObj.get(player.displayName);
		if (stateInj.healthStatus === 'injury') return 'fas fa-band-aid';
		else if (stateInj.healthStatus === 'complaint') return 'fas fa-frown';
		else if (stateInj.healthStatus === 'illness') return 'fas fa-thermometer-three-quarters';
	}
};

export const arrowUp = (player: Player, availabilityService: AvailabiltyService): boolean => {
	if (!player.goScores) return false;
	if (player.goScores[1]) {
		if (player.goScores[0].score - player.goScores[1].score > 15) {
			return true;
		} else {
			return checkColorDiffIncr(player.goScores[0], player.goScores[1], availabilityService);
		}
	} else {
		return false;
	}
};

export const arrowDown = (player: Player, availabilityService: AvailabiltyService): boolean => {
	if (!player.goScores) return false;
	if (player.goScores[1]) {
		if (player.goScores[0].score - player.goScores[1].score < -15) {
			return true;
		} else {
			return checkColorDiffDecr(player.goScores[0], player.goScores[1], availabilityService);
		}
	} else {
		return false;
	}
};

export const checkColorDiffIncr = (go1: GOScore, go2: GOScore, availabilityService: AvailabiltyService): boolean => {
	if (!go1 || !go2) return false;
	if (availabilityService.getReadinessColor(go2) === 'red') {
		if (
			availabilityService.getReadinessColor(go1) === 'yellow' ||
			availabilityService.getReadinessColor(go1) === 'green'
		) {
			return true;
		} else {
			return false;
		}
	} else if (availabilityService.getReadinessColor(go2) === 'yellow') {
		if (availabilityService.getReadinessColor(go1) === 'green') {
			return true;
		} else {
			return false;
		}
	}
};

export const checkColorDiffDecr = (go1: GOScore, go2: GOScore, availabilityService: AvailabiltyService): boolean => {
	if (!go1 || !go2) return false;
	if (availabilityService.getReadinessColor(go2) === 'green') {
		if (
			availabilityService.getReadinessColor(go1) === 'yellow' ||
			availabilityService.getReadinessColor(go1) === 'red'
		) {
			return true;
		} else {
			return false;
		}
	} else if (availabilityService.getReadinessColor(go2) === 'yellow') {
		if (availabilityService.getReadinessColor(go1) === 'red') {
			return true;
		} else {
			return false;
		}
	}
};

export const noScores = (player: Player): boolean => {
	if (!player.goScores || player.goScores.length <= 1) return true;
};

export const getCircleColor = (player: Player, availabilityService: AvailabiltyService): string | null => {
	return player ? availabilityService.getCurrentHealthStatusColor(player) : null;
};

export const playerAvailabilityWithReturn = (injuryMapObj: Map<string, any>, player: Player) => {
	if (injuryMapObj && player) {
		const stateInj = injuryMapObj.get(player.displayName);
		if (stateInj && stateInj.available === InjuryAvailability.NotAvailable) return stateInj.expected;
		else return null;
	}
};
