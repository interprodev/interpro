import { Player, Team } from '@iterpro/shared/data-access/sdk';

export default (player: Player, team: Team) => {
	return {
		player,
		team,
		performanceMetrics: null,
		tacticalMetrics: null,
		robustness: null
	};
};
