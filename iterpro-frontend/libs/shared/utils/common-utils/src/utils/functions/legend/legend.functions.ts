import { LegendRowType, PlayerStatusLegendRow } from '@iterpro/shared/data-access/sdk';

export function getPlayerStatusLegendConfiguration(isFromTacticsPreparation: boolean): PlayerStatusLegendRow[] {
	const legendConfig = [
		{
			type: LegendRowType.Icon,
			icon: 'fas fa-ambulance',
			label: 'tactics.legend.notAvailableInjuryComplaint'
		},
		{
			type: LegendRowType.Icon,
			icon: 'fas fa-band-aid',
			label: 'tactics.legend.availableNotCompletedHealed'
		},
		{
			type: LegendRowType.Icon,
			icon: 'fas fa-temperature-high',
			label: 'tactics.legend.notAvailableIllness'
		},
		{
			type: LegendRowType.Icon,
			icon: 'fas fa-exclamation-triangle',
			label: 'tactics.legend.beCareful'
		},
		{
			type: LegendRowType.Icon,
			icon: 'fas fa-frown',
			label: 'tactics.legend.availableButComplaint'
		},
		{
			type: isFromTacticsPreparation ? LegendRowType.Circle : LegendRowType.Point,
			color: 'red',
			label: 'tactics.legend.poorReadiness'
		},
		{
			type: isFromTacticsPreparation ? LegendRowType.Circle : LegendRowType.Point,
			color: 'yellow',
			label: 'tactics.legend.moderateReadiness'
		},
		{
			type: isFromTacticsPreparation ? LegendRowType.Circle : LegendRowType.Point,
			color: 'green',
			label: 'tactics.legend.optimalReadiness'
		},
		{
			type: isFromTacticsPreparation ? LegendRowType.Circle : LegendRowType.Point,
			color: 'lightgrey',
			label: 'tactics.legend.notMeasuredReadiness'
		}
	];
	if (isFromTacticsPreparation) {
		legendConfig.unshift(
			{
				type: LegendRowType.Icon,
				icon: 'fas fa-long-arrow-up',
				label: 'tactics.legend.positiveTrend'
			},
			{
				type: LegendRowType.Icon,
				icon: 'fas fa-long-arrow-down',
				label: 'tactics.legend.negativeTrend'
			}
		);
	}
	return legendConfig;
}
