import { ReportDataColumn } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';
import { Column } from '../interfaces/table.interfaces';

export const getColumns = (reportDataColumns: ReportDataColumn[]) => {
	const columns: Column[] = [
		{
			field: 'completion',
			header: 'completion',
			sortable: true,
			align: 'center',
			group: 'general',
			type: 'completion'
		},
		{
			field: 'scout',
			header: 'positions.scout',
			sortable: true,
			align: 'left',
			group: 'general'
		},
		{
			field: 'start',
			header: 'date',
			sortable: true,
			type: 'date',
			width: '100px',
			group: 'general'
		},
		{
			field: 'displayName',
			header: 'profile.player',
			sortable: true,
			align: 'left',
			group: 'general'
		},
		{
			field: 'title',
			header: 'game',
			width: '200px',
			sortable: true,
			align: 'left',
			group: 'general'
		},
		{
			field: 'homeTeam',
			header: 'event.team.home',
			sortable: true,
			align: 'left',
			group: 'general'
		},
		{
			field: 'awayTeam',
			header: 'event.team.away',
			sortable: true,
			align: 'left',
			group: 'general'
		},
		{
			field: 'level',
			header: 'scouting.game.level',
			sortable: true,
			group: 'general',
			type: 'translate'
		},
		{
			field: 'report',
			header: 'scouting.game.reportText',
			width: '100px',
			sortable: true,
			type: 'report',
			group: 'general'
		},
		{
			field: 'videoAttachment',
			header: 'scouting.game.video',
			width: '100px',
			sortable: true,
			type: 'video',
			group: 'general'
		},
		{
			field: 'docAttachment',
			header: 'scouting.game.document',
			width: '100px',
			sortable: true,
			type: 'doc',
			group: 'general'
		},
		{
			field: 'lastUpdate',
			header: 'lastUpdate2',
			sortable: true,
			type: 'datetime',
			group: 'general'
		},
		{
			field: 'competition',
			header: 'event.subformat',
			sortable: false,
			group: 'general',
			align: 'left'
		},
		{
			field: 'lastUpdateAuthor',
			header: 'lastAuthor',
			sortable: true,
			type: 'translate',
			group: 'general'
		},
		{
			field: 'nationality',
			header: 'profile.overview.nationality',
			width: '100px',
			sortable: false,
			align: 'center',
			type: 'flag',
			group: 'general'
		},
		{
			field: 'birthYear',
			header: 'profile.overview.birthYear',
			sortable: true,
			group: 'general'
		},
		{
			field: 'position',
			header: 'profile.position',
			sortable: true,
			type: 'translate',
			group: 'general'
		},
		{
			field: 'thirdPartyProviderId',
			header: 'thirdPartyProviderId',
			sortable: false,
			hideInTable: true
		},
		{
			field: 'thirdPartyProviderTeamId',
			header: 'thirdPartyProviderTeamId',
			sortable: false,
			hideInTable: true
		},
		{
			field: 'thirdPartyProviderCompetitionId',
			header: 'thirdPartyProviderCompetitionId',
			sortable: false,
			hideInTable: true
		}
	];
	if (reportDataColumns) {
		const reportDataColumnsMapped: Column[] = reportDataColumns.map(item => {
			return {
				field: item.key,
				header: item.label,
				sortable: true,
				group: 'reportData',
				type: item?.type
			};
		});
		return [...columns, ...reportDataColumnsMapped];
	}
	return columns;
};

const getColumnsByGroup = (group: string, reportDataColumns?: ReportDataColumn[]): SelectItem[] =>
	getColumns(reportDataColumns).reduce(
		(accumulator, column) =>
			!!column.group && column.group === group
				? [...accumulator, { label: column.filterLabel || column.header, value: column.field }]
				: accumulator,
		[]
	);

export const getBasicColumnOptions = (models: string[]) => {
	return [
		{
			label: 'general',
			options: getColumnsByGroup('general'),
			model: models || []
		}
	];
};

export const getReportColumnOptions = (reportDataColumns: ReportDataColumn[]) => {
	return [
		{
			label: 'Game Report',
			options: getColumnsByGroup('reportData', reportDataColumns),
			model: reportDataColumns.map(({ key }) => key) || []
		}
	];
};

export const initialVisibleBasicColumns = [
	'completion',
	'scout',
	'start',
	'displayName',
	'homeTeam',
	'awayTeam',
	'level',
	'report',
	'position',
	'lastUpdate',
	'lastUpdateAuthor',
	'competition',
	'nationality',
	'birthYear'
];
