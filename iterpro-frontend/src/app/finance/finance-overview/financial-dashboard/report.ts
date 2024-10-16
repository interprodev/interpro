import { toShortNumber } from '@iterpro/shared/ui/pipes';
import { FinancialDashboardComponent } from './financial-dashboard.component';
import { clearCircularJSON } from '@iterpro/shared/utils/common-utils';

const toSN = n => toShortNumber(n, true);

const getReport = (component: FinancialDashboardComponent) => {
	const t = component.translate.instant.bind(component.translate);
	// const data = exampleData;
	return {
		title: t('financial.overview'),
		tot: {
			title: t('financial.overview.totSquadValue'),
			value: `${component.currentTeamService.getCurrency()}${toSN(
				component.taxesFlag ? component.totalSquadValue.totalSquadValueGross : component.totalSquadValue.totalSquadValue
			)}`,
			label: t('millions p/a'),
			chart: {
				data: clearCircularJSON(component.teamValuesChartData),
				options: component.teamValuesChartOptions
			}
		},
		avg: {
			title: t('financial.overview.totalContractValue'),
			value: {
				label: t('value'),
				value: `${component.currentTeamService.getCurrency()}${toSN(
					component.taxesFlag
						? component.contractsData.totalContractValueGross
						: component.contractsData.totalContractValue
				)}`,
				label2: t('financial.overview.millionsPA')
			},
			length: {
				label: t('financial.overview.avgLength'),
				yearValue: component.contractsData.avgContractLength.years,
				yearLabel: t('years'),
				monthValue: component.contractsData.avgContractLength.months,
				monthLabel: t('months')
			},
			playersPa: {
				label: t('financial.overview.playersPa'),
				value: `${component.currentTeamService.getCurrency()}${toSN(
					component.taxesFlag ? component.contractsData.playersPaGross || 0 : component.contractsData.playersPa || 0
				)}`
			},
			staffsPa: {
				label: t('financial.overview.staffsPa'),
				value: `${component.currentTeamService.getCurrency()}${toSN(
					component.taxesFlag ? component.contractsData.staffsPaGross || 0 : component.contractsData.staffsPa || 0
				)}`
			}
		},
		expiry: {
			title: t('financial.overview.contractExpiry'),
			value: component.contractExpiry.contractsExpireIn1Year,
			label: t('financial.overview.expiry'),
			chart: {
				data: clearCircularJSON(component.expiringContractsChartData),
				options: component.expiringContractChartOptions
			}
		},
		wages: {
			title: t('financial.overview.fixedPayWageBill'),
			fixed: {
				title: t('financial.overview.fixedPayWageBill'),
				players: {
					label: t('financial.overview.players'),
					value: `${component.currentTeamService.getCurrency()}${toSN(
						component.taxesFlag
							? component.contractsData.fixedWagePlayersSumGross
							: component.contractsData.fixedWagePlayersSum
					)}`,
					label2: t('financial.overview.millionsPA')
				},
				staff: {
					label: t('financial.overview.staff'),
					value: `${component.currentTeamService.getCurrency()}${toSN(
						component.taxesFlag
							? component.contractsData.fixedWageStaffSumGross
							: component.contractsData.fixedWageStaffSum
					)}`,
					label2: t('financial.overview.millionsPA')
				}
			},
			bonus: {
				title: t('financial.overview.bonuses'),
				players: {
					label: t('financial.overview.players'),
					value: `${component.currentTeamService.getCurrency()}${toSN(
						component.taxesFlag
							? // @ts-ignore
							  component.contractsData.bonusWonGross
							: // @ts-ignore
							  component.contractsData.bonusWon
					)}`,
					label2: t('financial.overview.millionsPA')
				},
				staff: {
					label: t('financial.overview.staff'),
					value: `${component.currentTeamService.getCurrency()}${toSN(
						component.taxesFlag
							? // @ts-ignore
							  component.contractsData.bonusStaffWonGross
							: // @ts-ignore
							  component.contractsData.bonusStaffWon
					)}`,
					label2: t('financial.overview.millionsPA')
				}
			}
		},
		investments: {
			title: t('financial.overview.investmentPerformance'),
			boxes: [
				{
					title: t('financial.overview.avgAvailability'),
					value: (toSN(component.investmentPerformance.teamAvailability) || '') + '%'
				},
				{
					title: t('financial.overview.lossesByInjury'),
					value: `${component.currentTeamService.getCurrency()}${toSN(
						component.taxesFlag ? component.investmentPerformance.lossesGross : component.investmentPerformance.losses
					)}`
				},
				{
					title: t('financial.overview.teamRoi'),
					value: `${component.currentTeamService.getCurrency()}${toSN(
						component.taxesFlag ? component.investmentPerformance.teamRoiGross : component.investmentPerformance.teamRoi
					)}/<small>${toSN(
						component.taxesFlag
							? component.investmentPerformance.teamResidualRoiGross
							: component.investmentPerformance.teamResidualRoi
					)}</small>`
				},
				{
					title: t('financial.overview.capitalGain'),
					value: `${component.currentTeamService.getCurrency()}${
						toSN(component.taxesFlag
							? component.investmentPerformance?.teamCapitalGainGross
							: component.investmentPerformance?.teamCapitalGain)
					}`
				}
			]
		},
		contracts: {
			title: t('financial.overview.typeOfContracts'),
			chart: {
				data: clearCircularJSON(component.contractTypesChartData),
				options: component.contractTypesChartOptions
			}
		}
	};
};

export default getReport;
