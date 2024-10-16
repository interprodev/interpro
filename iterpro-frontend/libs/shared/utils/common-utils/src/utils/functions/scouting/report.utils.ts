import { PlayerAttribute, ReportDataAvg, ScoutingColumnVisibility, TableColumn } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';
import { SportType, getLimb } from '../../../constants/sport.constants';
import { getVisibleColumnsForGroup } from '../table/table.functions';

export const getReportColumns = (
	reportDataColumns: ReportDataAvg[],
	playerAttributes: PlayerAttribute[],
	isSwiss = false,
	hasSomeArchivedPlayer = false,
	sportType: SportType
) => {
	const limb = getLimb(sportType);
	let columns: TableColumn[] = [
		{
			field: 'downloadUrl',
			header: '',
			sortable: false,
			width: '80px',
			group: 'general',
			filterLabel: 'settings.general.picture',
			type: 'image',
			frozen: true
		},
		{
			field: 'name',
			header: 'profile.overview.name',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		},
		{
			field: 'lastName',
			header: 'profile.overview.surname',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		},
		{
			field: 'displayName',
			header: 'profile.overview.displayName',
			alternativeHeader: 'profile.overview.name',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text',
			frozen: true
		},
		{
			field: 'email',
			header: 'profile.contact.email',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		},
		{
			field: 'phone',
			header: 'profile.contact.phone',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		},
		{
			field: 'position',
			header: 'profile.position',
			sortable: true,
			group: 'attributes',
			align: 'center',
			type: 'translate'
		},
		{
			field: 'birthDate',
			header: 'profile.overview.birth',
			sortable: true,
			group: 'general',
			align: 'center',
			type: 'date'
		},
		{
			field: 'birthYear',
			header: 'profile.overview.birthYear',
			sortable: true,
			group: 'general',
			align: 'center',
			type: 'text'
		},
		{
			field: 'nationality',
			header: 'profile.overview.nationality',
			sortable: true,
			group: 'general',
			align: 'center',
			type: 'flag'
		},
		{
			field: 'altNationality',
			header: 'profile.overview.altNationality',
			sortable: true,
			group: 'general',
			type: 'flag'
		},
		{
			field: 'passport',
			header: 'profile.passport',
			sortable: true,
			group: 'general',
			type: 'flag'
		},
		{
			field: 'altPassport',
			header: 'profile.overview.altPassport',
			sortable: true,
			group: 'general',
			type: 'flag'
		},
		{
			field: limb,
			header: `profile.position.${limb}`,
			alternativeHeader: `profile.position.${limb}Abbreviation`,
			sortable: true,
			group: 'attributes',
			align: 'center',
			type: 'translate'
		},
		{
			field: 'nationalityOrigin',
			header: 'admin.contracts.origin',
			sortable: true,
			group: 'general',
			type: 'translate'
		},
		{
			field: 'currentTeam',
			header: 'profile.team',
			sortable: true,
			group: 'general',
			align: 'center',
			type: 'text'
		},
		{
			field: 'currentLeague',
			header: 'scouting.league',
			sortable: true,
			group: 'general',
			type: 'text'
		},
		{
			field: 'contractEnd',
			header: 'profile.overview.contractExpiry',
			sortable: true,
			group: 'general',
			type: 'date'
		},
		{
			field: 'lastSeasonAttributePlayerDescription',
			header: 'scouting.playerAttributes.lastAttributeDescription',
			sortable: true,
			group: 'attributes',
			align: 'center',
			type: 'report'
		},
		{
			field: 'lastSeasonAttributeDate',
			header: 'scouting.playerAttributes.lastAttributeDate',
			sortable: true,
			group: 'attributes',
			align: 'center',
			type: 'date'
		},
		{
			field: 'lastSeasonAttributeAuthor',
			header: 'scouting.playerAttributes.lastAttributeAuthor',
			sortable: true,
			group: 'attributes',
			align: 'center',
			type: 'text'
		},
		{
			field: 'creationDate',
			header: 'general.createdOn',
			sortable: true,
			group: 'general',
			type: 'date'
		}
	];
	if (playerAttributes && !isSwiss) {
		const averageAttributes: TableColumn[] = [
			{
				field: 'offensive',
				header: 'profile.attributes.offensive',
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			},
			{
				field: 'defensive',
				header: 'profile.attributes.defensive',
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			},
			{
				field: 'attitude',
				header: 'profile.attributes.attitude',
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			}
		];
		const playerAttributesColumnsMapped: TableColumn[] = playerAttributes.map(item => {
			return {
				field: item.value,
				header: item.label,
				tooltip: item?.description,
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			};
		});
		columns = [...columns, ...averageAttributes, ...playerAttributesColumnsMapped];
	}
	if (reportDataColumns) {
		const reportColumns: TableColumn[] = [
			{
				field: 'lastGameReportDate',
				header: 'scouting.gameReport.lastReportDate',
				sortable: true,
				group: 'reportData',
				type: 'date'
			},
			{
				field: 'lastGameReportAuthor',
				header: 'scouting.gameReport.lastReportAuthor',
				sortable: true,
				group: 'reportData',
				type: 'text'
			},
			{
				field: 'gameReportsNumber',
				header: 'scouting.gameReport.reportsNumber',
				sortable: true,
				group: 'reportData',
				type: 'text'
			},
			{
				field: 'lastGameReportTeams',
				header: 'scouting.gameReport.lastGameReportTeams',
				sortable: true,
				group: 'reportData',
				type: 'text'
			}
		];
		const reportDataColumnsMapped: TableColumn[] = reportDataColumns.map(item => {
			return {
				field: item.key,
				header: item.label,
				tooltip: item?.tooltip,
				sortable: true,
				group: 'reportData',
				type: 'reportData'
			};
		});
		columns = [...columns, ...reportColumns, ...reportDataColumnsMapped];
	}

	if (isSwiss) {
		columns.push({
			field: 'prognosis',
			header: 'prognosis',
			sortable: true,
			group: 'reportData',
			type: 'prognosis'
		});
	}
	columns.push(
		{
			field: 'agent',
			header: 'profile.overview.agent',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		},
		{
			field: 'agentEmail',
			header: 'profile.overview.agentEmail',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		},
		{
			field: 'agentPhone',
			header: 'profile.overview.agentPhone',
			sortable: true,
			align: 'left',
			group: 'general',
			type: 'text'
		}
	);
	if (!isSwiss) {
		columns.push(
			{
				field: 'feeRange',
				header: 'profile.overview.transferfee',
				sortable: true,
				group: 'deal',
				align: 'center',
				type: 'text'
			},
			{
				field: 'wageRange',
				header: 'profile.overview.transferwage',
				sortable: true,
				group: 'deal',
				align: 'center',
				type: 'text'
			}
		);
	}
	columns.push(
		{
			field: 'weight',
			header: 'profile.overview.weight',
			sortable: true,
			group: 'attributes',
			type: 'text'
		},
		{
			field: 'height',
			header: 'profile.overview.height',
			sortable: true,
			group: 'attributes',
			type: 'text'
		}
	);
	columns.push(
		{
			field: 'associatedPlayerName',
			header: 'scouting.assignedTo',
			sortable: true,
			align: 'left',
			group: 'attributes',
			type: 'text'
		},
		{
			field: 'associatedPosition',
			header: 'scouting.recommended',
			sortable: true,
			group: 'attributes',
			type: 'text'
		}
	);
	if (hasSomeArchivedPlayer) {
		columns.push(
			{
				field: 'archivedDate',
				header: 'admin.squads.player.archivedDate',
				sortable: true,
				type: 'date'
			},
			{
				field: 'archivedMotivation',
				header: 'admin.squads.player.archivedMotivation',
				sortable: false,
				type: 'text'
			}
		);
	}
	return columns;
};

const getColumnsByGroup = (
	group: string,
	isSwiss: boolean,
	isWatford: boolean,
	sportType: SportType,
	reportDataColumns?: ReportDataAvg[],
	playerAttributes?: any[]
): SelectItem[] =>
	getReportColumns(reportDataColumns as ReportDataAvg[], playerAttributes as any[], isSwiss, false, sportType).reduce(
		(accumulator, column) =>
			!!column.group && column.group === group
				? [...accumulator, { label: column.filterLabel || column.header, value: column.field }]
				: (accumulator as any),
		[]
	);

export const getScoutingColumnOptions = (
	models: ScoutingColumnVisibility,
	reportDataColumns: ReportDataAvg[],
	standardAttributes: PlayerAttribute[],
	isSwiss = false,
	isWatfordGameReport = false,
	sportType: SportType
) => {
	const customOptions = [
		{
			label: 'profile.deal.noName',
			options: getColumnsByGroup('deal', isSwiss, isWatfordGameReport, sportType),
			model: models.deal || []
		}
	];
	const result = [
		{
			label: 'general',
			options: getColumnsByGroup('general', isSwiss, isWatfordGameReport, sportType),
			model: models.general || []
		},
		{
			label: 'Report Data',
			options: getColumnsByGroup('reportData', isSwiss, isWatfordGameReport, sportType, reportDataColumns),
			model: [...models.reportData, ...reportDataColumns.map(({ key }) => key)] || []
		},
		...customOptions,
		{
			label: 'profile.tabs.attributes',
			options: getColumnsByGroup('attributes', isSwiss, isWatfordGameReport, sportType, [], standardAttributes),
			model: models.attributes || []
		}
	];
	if (isSwiss || isWatfordGameReport) return result.filter(({ label }) => label !== 'profile.deal.noName');
	return result;
};

export const getColumnVisibility = (columns: TableColumn[], visibleColumns: string[]): ScoutingColumnVisibility => {
	return {
		general: getVisibleColumnsForGroup('general', columns, visibleColumns),
		deal: getVisibleColumnsForGroup('deal', columns, visibleColumns),
		attributes: getVisibleColumnsForGroup('attributes', columns, visibleColumns),
		reportData: getVisibleColumnsForGroup('reportData', columns, visibleColumns)
	};
};
