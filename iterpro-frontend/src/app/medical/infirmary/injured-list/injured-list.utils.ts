import { Injury, TableColumn } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage, parseHtmlStringToText } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment/moment';
import { SelectItem } from 'primeng/api';

export interface InjuredListColumn extends TableColumn {
	column?: string; // identify column when field is not unique
	group?: 'general' | 'injury' | 'tests' | 'treatments'; // group to which column belongs
}

export const getColumns = (): InjuredListColumn[] => {
	return [
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
			field: 'age',
			header: 'profile.overview.age',
			sortable: true,
			group: 'general',
			type: 'age'
		},
		{ field: 'issue', header: 'medical.infirmary.details.issue', sortable: true, group: 'injury', type: 'translate' },
		{ field: 'osics', header: 'OSIICS', group: 'injury', sortable: true, type: 'translate' },
		{
			field: 'location',
			header: 'medical.infirmary.details.location',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'currentStatus',
			header: 'medical.infirmary.report.status',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'lastAssessment',
			header: 'medical.infirmary.report.lastAssessment',
			sortable: true,
			group: 'tests',
			type: 'translate'
		},
		{
			field: 'lastTreatment',
			header: 'medical.infirmary.report.lastTherapy',
			sortable: true,
			group: 'treatments',
			type: 'translate'
		},
		{
			field: 'injuryDate',
			header: 'medical.infirmary.report.injuryDate',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'admissionDate',
			header: 'medical.infirmary.details.admissionDate',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{ field: 'system', header: 'medical.infirmary.details.system', sortable: true, group: 'injury', type: 'translate' },
		{
			field: 'anatomicalDetails',
			header: 'medical.infirmary.details.anatomicalDetails',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{ field: 'type', header: 'medical.infirmary.details.type', sortable: true, group: 'injury', type: 'translate' },
		{
			field: 'reinjury',
			header: 'medical.infirmary.details.reInjury',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'category',
			header: 'medical.infirmary.details.category',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'contact',
			header: 'medical.infirmary.details.contact',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'mechanism',
			header: 'medical.infirmary.details.mechanism',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'occurrence',
			header: 'medical.infirmary.details.occurrence',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'severity',
			header: 'medical.infirmary.details.severity',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'diagnosis',
			header: 'medical.infirmary.report.diagnosis',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'surgery',
			header: 'medical.infirmary.details.surgery',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'expectedReturn',
			header: 'medical.infirmary.report.expectedReturn',
			sortable: true,
			group: 'injury',
			type: 'translate'
		},
		{
			field: 'endDate',
			header: 'medical.infirmary.details.endDate',
			sortable: true,
			group: 'injury',
			type: 'translate'
		}
	];
};

export type ColumnVisibility = Record<'general' | 'injury' | 'tests' | 'treatments', string[]>;

export const initialVisibility: ColumnVisibility = {
	general: ['downloadUrl', 'displayName', 'position', 'age'],
	injury: [
		'issue',
		'osics',
		'location',
		'currentStatus',
		'injuryDate',
		'admissionDate',
		'system',
		'anatomicalDetails',
		'type',
		'reinjury',
		'category',
		'contact',
		'mechanism',
		'occurrence',
		'severity',
		'diagnosis',
		'surgery',
		'expectedReturn',
		'endDate'
	],
	tests: ['lastAssessment'],
	treatments: ['lastTreatment']
};
export const getColumnOptions = (models: ColumnVisibility) => {
	return [
		{
			label: 'general',
			options: getColumnsByGroup('general'),
			model: models.general || []
		},
		{
			label: 'injury',
			options: getColumnsByGroup('injury'),
			model: models.injury || []
		},
		{
			label: 'tests',
			options: getColumnsByGroup('tests'),
			model: models.tests || []
		},
		{
			label: 'treatments',
			options: getColumnsByGroup('treatments'),
			model: models.treatments || []
		}
	];
};

export const getColumnsFields = (): string[] => {
	return getColumns().map(({ field }) => field);
};
export const getColumnsByGroup = (group: string): SelectItem[] =>
	getColumns().reduce(
		(accumulator, column) =>
			!!column.group && column.group === group
				? [...accumulator, { label: column.filterLabel || column.header, value: column.field }]
				: accumulator,
		[]
	);

export const lastOf = (items, key) => {
	if (!items || !items.length) return '';
	const keepLast = (last, current) => (last > current[key] ? last : current[key]);
	return items.reduce(keepLast, null);
};

export const f = date => (date ? moment(date).format(getMomentFormatFromStorage()) : '');

export const getInjuryValues = (injury: Injury, t: Function) => {
	const values = {
		issue: injury.issue ? t(injury.issue) : '',
		osics: injury.osics || '',
		location: injury.location ? t(injury.location) : '',
		currentStatus: injury.currentStatus ? t(injury.currentStatus) : '',
		injuryDate: f(injury.date),
		admissionDate: f(injury.admissionDate),
		system: injury.system ? injury.system.map(t).join(', ') : '',
		anatomicalDetails: injury.anatomicalDetails ? injury.anatomicalDetails.map(t).join(', ') : '',
		type: injury.type ? injury.type.map(t).join(', ') : '',
		reinjury: injury.reinjury ? t('yes') : t('no'),
		category: injury.category ? t(injury.category) : '',
		contact: injury.contact ? t('yes') : t('no'),
		mechanism: injury.mechanism ? t(injury.mechanism) : '',
		occurrence: injury.occurrence ? t(injury.occurrence) : '',
		severity: injury.severity ? t(injury.severity) : '',
		diagnosis: parseHtmlStringToText(injury.diagnosis),
		surgery: injury.surgery ? t('yes') : t('no'),
		expectedReturn: f(injury.expectedReturn),
		endDate: f(injury.endDate)
	};
	return values;
};
