import { attributeAvgCategory, ColumnPayload, ColumnVisibility, PlayerTableColumn } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

const initialVisibility: ColumnVisibility = {
	general: ['downloadUrl', 'displayName', 'position', 'birthDate', 'nationality', 'injury', 'pending', 'certificate'],
	attributes: ['height', 'weight', 'foot'],
	fitness: ['readiness'],
	robustness: []
};

export const getColumns = ({ testHeaders, isTipss, hasSomeArchivedPlayers }: ColumnPayload): PlayerTableColumn[] => {
	const columns: PlayerTableColumn[] = [
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
			field: 'displayName',
			header: 'profile.overview.name',
			sortable: true,
			align: 'left',
			group: 'general',
			frozen: true
		},
		{
			field: 'position',
			header: 'profile.position',
			sortable: true,
			group: 'general',
			type: 'translate'
		},
		{
			field: 'birthDate',
			header: 'profile.overview.age',
			sortable: true,
			group: 'general',
			type: 'age'
		},
		{
			field: 'nationality',
			header: 'profile.overview.nationality',
			sortable: true,
			group: 'general',
			type: 'flag'
		},
		{
			field: 'height',
			header: 'profile.overview.height',
			sortable: true,
			group: 'attributes',
			type: 'translate'
		},
		{
			field: 'weight',
			header: 'profile.overview.weight',
			sortable: true,
			group: 'attributes',
			type: 'translate'
		},
		{
			field: 'foot',
			header: 'profile.position.foot',
			sortable: true,
			group: 'attributes',
			type: 'translate'
		},
		{
			field: 'readiness',
			header: 'Readiness',
			sortable: true,
			group: 'fitness',
			type: 'readiness',
			align: 'center'
		},
		{
			field: 'injury',
			header: 'medical.infirmary.details.issue.injury',
			sortable: true,
			group: 'general',
			type: 'injury'
		},
		{
			field: 'pending',
			header: 'Pending',
			sortable: true,
			group: 'general',
			type: 'translate'
		},
		{
			field: 'certificate',
			header: 'Certificate',
			sortable: true,
			group: 'general',
			type: 'expiration'
		}
	];
	if (hasSomeArchivedPlayers) {
		columns.push(
			{
				field: 'archivedDate',
				header: 'admin.squads.player.archivedDate',
				sortable: true,
				group: 'general',
				type: 'date'
			},
			{
				field: 'archivedMotivation',
				header: 'admin.squads.player.archivedMotivation',
				sortable: true,
				group: 'general',
				type: 'translate'
			}
		);
	}
	const testColumns: PlayerTableColumn[] = (testHeaders || []).map(column => ({
		field: column,
		header: column,
		sortable: true,
		group: 'fitness',
		type: 'test'
	}));
	let averageAttributes: PlayerTableColumn[] = [];
	if (!isTipss) {
		averageAttributes = [
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
	} else {
		averageAttributes = [
			{
				field: 'performance',
				header: 'home.performance',
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			},
			{
				field: 'potential',
				header: 'scouting.survey.potential',
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			},
			{
				field: 'prognosis',
				header: 'prognosis',
				sortable: true,
				group: 'attributes',
				type: 'playerAttributes'
			}
		];
	}
	const robustnessColumns: PlayerTableColumn[] = [
		{
			field: 'healthStatusReadiness',
			header: 'readiness.healthStatus',
			sortable: true,
			group: 'robustness',
			type: 'translate',
			translateValuePrefix: 'tooltip.'
		},
		{
			field: 'injuriesNumber',
			header: 'player.robustness.n_injuries',
			sortable: true,
			group: 'robustness'
		},
		{
			field: 'injurySeverity',
			header: 'player.robustness.injury_severity',
			sortable: true,
			type: 'number',
			group: 'robustness'
		},
		{
			field: 'reinjuryRate',
			header: 'player.robustness.reinjury_rate',
			sortable: true,
			group: 'robustness'
		},
		{
			field: 'availability',
			header: 'player.robustness.availability',
			sortable: true,
			group: 'robustness',
			type: 'percentage'
		},
		{
			field: 'apps',
			header: 'player.robustness.apps',
			sortable: true,
			group: 'robustness'
		},
		{
			field: 'gameMissed',
			header: 'player.robustness.game_missed',
			sortable: true,
			group: 'robustness'
		},
		{
			field: 'sessionsMissed',
			header: 'player.robustness.player.robustness.legend.training_missed',
			sortable: true,
			group: 'robustness'
		}
	];
	return [...columns, ...averageAttributes, ...robustnessColumns, ...testColumns];
};

export const getInitialVisibility = (isTipss: boolean): ColumnVisibility => {
	const fields = isTipss ? ['performance', 'potential', 'prognosis'] : attributeAvgCategory;
	return { ...initialVisibility, attributes: [...initialVisibility.attributes, ...fields] };
};

export const getColumnOptions = (models: ColumnVisibility, payload: ColumnPayload) => {
	return [
		{
			label: 'general',
			options: getColumnsByGroup('general', payload),
			model: models.general || []
		},
		{
			label: 'attributes',
			options: getColumnsByGroup('attributes', payload),
			model: models.attributes || []
		},
		{
			label: 'fitness',
			options: getColumnsByGroup('fitness', payload),
			model: models.fitness
		},
		{
			label: 'robustness',
			options: getColumnsByGroup('robustness', payload),
			model: models.robustness || []
		}
	];
};

export const getColumnsFields = (payload: ColumnPayload): string[] => {
	return getColumns(payload).map(({ field }) => field);
};

export const getColumnsByGroup = (group: string, payload: ColumnPayload): SelectItem[] => {
	return getColumns(payload).reduce((accumulator: SelectItem[], column) => {
		if (column.group && column.group === group) {
			return [...accumulator, { label: column.filterLabel || column.header, value: column.field }];
		}
		return accumulator;
	}, []);
};
