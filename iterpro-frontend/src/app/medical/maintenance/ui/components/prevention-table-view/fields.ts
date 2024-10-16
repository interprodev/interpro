import { TableColumn } from '@iterpro/shared/data-access/sdk';
import { ColumnVisibilityOption } from '@iterpro/shared/ui/components';
import { getVisibleColumnsForGroup } from '@iterpro/shared/utils/common-utils';
import { SelectItem } from 'primeng/api';

export type MedicalPreventionColumnVisibility = Record<
	'general' | 'readiness' | 'injury' | 'tests' | 'treatments',
	string[]
>;

export interface MedicalPreventionColumn extends TableColumn {
	column?: string; // identify column when field is not unique
	group?: 'general' | 'readiness' | 'injury' | 'tests' | 'treatments'; // group to which column belongs
}

export const getColumns = (testColumns: string[] = []) => {
	const columns: MedicalPreventionColumn[] = [
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
			group: 'general'
		},
		{
			field: 'lastName',
			header: 'profile.overview.surname',
			sortable: true,
			align: 'left',
			group: 'general'
		},
		{
			field: 'displayName',
			header: 'profile.overview.displayName',
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
			field: 'birthDateText',
			header: 'profile.overview.birth',
			sortable: true,
			group: 'general'
		},
		{
			field: 'age',
			header: 'profile.overview.age',
			sortable: true,
			group: 'general',
			type: 'age'
		},
		{
			field: 'weight',
			header: 'profile.overview.weight',
			sortable: true,
			group: 'general'
		},
		{
			field: 'height',
			header: 'profile.overview.height',
			sortable: true,
			group: 'general'
		},
		{
			field: 'nationality',
			header: 'profile.overview.nationality',
			sortable: true,
			group: 'general',
			type: 'flag'
		}
	];
	columns.push(
		{
			field: 'readiness',
			header: 'navigator.readiness',
			sortable: true,
			group: 'readiness',
			type: 'readiness',
			align: 'center'
		},
		{
			field: 'readiness48h',
			header: 'readiness.last48h',
			sortable: true,
			group: 'readiness',
			type: 'readiness',
			align: 'center'
		},
		{
			field: 'readiness7d',
			header: 'readiness.last7d',
			sortable: true,
			group: 'readiness',
			type: 'readiness',
			align: 'center'
		}
	);
	columns.push(
		{
			field: 'injury',
			header: 'medical.infirmary.details.issue.injury',
			sortable: true,
			group: 'injury',
			type: 'injury',
			align: 'center'
		},
		{
			field: 'injuryStatus',
			header: 'notifications.injury',
			sortable: true,
			group: 'injury',
			align: 'center'
		},
		{
			field: '_chronicInjuries',
			header: 'chronicInjuries',
			sortable: true,
			group: 'injury',
			type: 'chronicInjuries',
			align: 'center'
		}
		// {
		// 	field: 'pending',
		// 	header: 'Pending',
		// 	sortable: true,
		// 	group: 'injury',
		// 	type: 'pending'
		// }
	);

	testColumns.forEach(column => {
		columns.push({
			field: column,
			header: column,
			sortable: true,
			group: 'tests',
			type: 'test'
		});
	});
	columns.push(
		{
			field: 'dayMedicalExams',
			header: 'prevention.table.medicalEvaluation',
			sortable: true,
			group: 'treatments',
			type: 'treatment',
			width: '200px'
		},
		{
			field: 'dayFunctionalTests',
			header: 'prevention.table.functionalTest',
			sortable: true,
			group: 'treatments',
			type: 'functionalTest',
			width: '200px'
		},
		{
			field: 'dayTreatments',
			header: 'prevention.table.treatments',
			sortable: true,
			group: 'treatments',
			type: 'treatment',
			width: '200px'
		}
	);
	columns.push({
		field: 'expiration',
		header: 'Certificate',
		sortable: true,
		group: 'general',
		type: 'expiration'
	});

	return columns;
};

const getColumnsByGroup = (group: string): SelectItem[] =>
	getColumns().reduce(
		(accumulator, column) =>
			!!column.group && column.group === group
				? [...accumulator, { label: column.filterLabel || column.header, value: column.field }]
				: accumulator,
		[]
	);

export const getTreatmentColumns = (): ColumnVisibilityOption => ({
	label: 'medical.statistics.treatments',
	options: getColumnsByGroup('treatments'),
	model: undefined
});

export const getColumnOptions = (models: MedicalPreventionColumnVisibility): ColumnVisibilityOption[] => {
	return [
		{
			label: 'general',
			options: getColumnsByGroup('general'),
			model: models.general || []
		},
		{
			label: 'readiness',
			options: getColumnsByGroup('readiness'),
			model: models.readiness || []
		},
		{
			label: 'medical.infirmary.details.issue.injury',
			options: getColumnsByGroup('injury'),
			model: models.injury || []
		}
	];
};

export const getColumnVisibility = (
	columns: TableColumn[],
	visibleColumns: string[]
): MedicalPreventionColumnVisibility => {
	return {
		general: getVisibleColumnsForGroup('general', columns, visibleColumns),
		readiness: getVisibleColumnsForGroup('readiness', columns, visibleColumns),
		injury: getVisibleColumnsForGroup('injury', columns, visibleColumns),
		tests: getVisibleColumnsForGroup('tests', columns, visibleColumns),
		treatments: getVisibleColumnsForGroup('treatments', columns, visibleColumns)
	};
};
