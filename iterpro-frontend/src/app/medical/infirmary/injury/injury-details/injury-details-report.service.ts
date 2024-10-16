import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';

import {
	Customer,
	Injury,
	MedicalTreatment,
	MixedType,
	PdfBase,
	PdfBasicType,
	PdfMixedTable,
	Player, TreatmentMetric
} from '@iterpro/shared/data-access/sdk';
import { CustomerNamePipe, SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	OsicsService,
	getMomentFormatFromStorage,
	parseHtmlStringToText,
	sortByDate, sortByName, ConstantService, CustomTreatmentService, isBase64Image
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import * as TrtUtilsService from '../../../../shared/treatments/utils/treatment-table-utils';
import { SelectItem } from 'primeng/api';
import { TreatmentsTooltipPipe } from '../../../../shared/treatments/pipes/treatments-tooltip.pipe';
import { TreatmentCategoriesTooltipPipe } from '../../../../shared/treatments/pipes/treatment-categories-tooltip.pipe';
import { MedicationLabelPipe } from '../../../../shared/treatments/pipes/medication-label.pipe';
import { TreatmentCompletePipe } from '../../../../shared/treatments/pipes/treatment-complete.pipe';

const toDateString = (date: Date) => (date ? moment(date).format(getMomentFormatFromStorage()) : '-');

const getDaysCurrentStatus = (injury: Injury) => {
	if (!injury.statusHistory || !injury.statusHistory.length) return '-';
	const date2 = new Date(injury.statusHistory[injury.statusHistory.length - 1].date);
	return Math.abs(getDaysFrom(date2));
};

const getDaysFrom = (date2: Date) => {
	if (!date2) return 0;
	const date1 = new Date();
	const timeDiff = date2.getTime() - date1.getTime();
	return Math.round(timeDiff / (1000 * 3600 * 24));
};

@Injectable({
	providedIn: 'root'
})
export class DetailsReportService {
	constructor(
		private osicsService: OsicsService,
		private azurePipe: AzureStoragePipe,
		private translate: TranslateService,
		private customerNamePipe: CustomerNamePipe,
		private constantService: ConstantService,
		private currentTeamService: CurrentTeamService,
		private selectItemLabelPipe: SelectItemLabelPipe,
		private medicationLabelPipe: MedicationLabelPipe,
		private treatmentsTooltipPipe: TreatmentsTooltipPipe,
		private treatmentCompletePipe: TreatmentCompletePipe,
		private customTreatmentService: CustomTreatmentService,
		private treatmentCategoriesTooltipPipe: TreatmentCategoriesTooltipPipe,
	) {
	}

	getReportData(
		customers: Customer[],
		player: Player,
		injury: Injury,
		injuryMedicalTreatments: MedicalTreatment[],
		durations: any[],
		bodyChartStyle: string,
		bodyChartLegend: any
	): InjuryDetailReportPDF {
		return {
			header: {
				title: this.translate.instant(`INJURY REPORT`).toUpperCase(),
				subTitle: ''
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			headers: {
				details: this.translate.instant('squads.players.tabs.details'),
				history: this.translate.instant('medical.infirmary.details.history'),
				assessments: this.translate.instant('assessment'),
				exams: this.translate.instant('medical.infirmary.exams'),
				sec: this.translate.instant('prevention.treatments.sec'),
				med: this.translate.instant('prevention.treatments.medicationSupplements'),
				phy: this.translate.instant('prevention.treatments.physiotherapy')
			},
			summary: {
				playerImage: {
					label: this.translate.instant('profile.overview.photo'),
					value:
						player.downloadUrl && isBase64Image(player.downloadUrl)
							? player.downloadUrl
							: this.azurePipe.transform(player.downloadUrl)
				},
				playerDisplayName: {
					label: this.translate.instant('profile.overview.displayName'),
					value: player.displayName
				},
				playerName: {
					label: this.translate.instant('profile.overview.name'),
					value: player.name
				},
				playerSurname: {
					label: this.translate.instant('profile.overview.surname'),
					value: player.lastName
				},
				playerAge: {
					label: this.translate.instant('profile.overview.age'),
					value: moment().diff(moment(player.birthDate), 'year')
				},
				playerWeight: {
					label: this.translate.instant('Weight'),
					value: player.weight
				},
				playerHeight: {
					label: this.translate.instant('profile.overview.height'),
					value: player.height
				}
			},
			bodyChartStyle,
			bodyChartLegend,
			details: this.getDetails(injury)[0],
			details2: this.getDetails(injury)[1],
			details3: this.getDetails(injury)[2],
			details4: this.getDetails(injury)[3],
			assessments: this.getAssessments(injury),
			historyTable: this.getHistory(injury, durations),
			examsTable: this.getExams(injury),
			treatmentsTable: this.getTreatments(injuryMedicalTreatments, customers)
		};
	}

	private getAssessments(injury: Injury): PDFAssessment[] {
		return sortByDate(injury._injuryAssessments || [], 'date').map(assessment => {
			const assessmentFields: PDFAssessment = {
				date: {
					label: this.translate.instant('medical.infirmary.assessments.date'),
					value: toDateString(assessment.date)
				},
				ROM: {
					label: this.translate.instant('medical.infirmary.assessments.rom'),
					value: this.translate.instant(assessment.rom || '-')
				},
				strength: {
					label: this.translate.instant('medical.infirmary.assessments.strength'),
					value: this.translate.instant(assessment.strength || '-')
				},
				stability: {
					label: this.translate.instant('medical.infirmary.assessments.stability'),
					value: this.translate.instant(assessment.stability || '-')
				},
				swelling: {
					label: this.translate.instant('medical.infirmary.assessments.swelling'),
					value: this.translate.instant(assessment.swelling || '-')
				},
				pain: {
					label: this.translate.instant('medical.infirmary.assessments.pain'),
					value: `${assessment.pain || assessment.pain === 0 ? assessment.pain : '-'}/10`
				},
				functionality: {
					label: this.translate.instant('medical.infirmary.assessments.functionality'),
					value: `${assessment.functionality || assessment.functionality === 0 ? assessment.functionality : '-'}/100`
				},
				notes: {
					label: this.translate.instant('medical.infirmary.assessments.notes'),
					value: assessment.notes
				},
				nextAssessment: {
					label: this.translate.instant('medical.infirmary.assessments.nextAssessment'),
					value: toDateString(assessment.next)
				},
				highPriority: {
					label: this.translate.instant('medical.infirmary.assessments.hightPriority'),
					value: this.translate.instant(assessment.highPriority === true ? 'Yes' : 'No')
				},
				available: {
					label: this.translate.instant('medical.infirmary.assessments.available'),
					value: this.translate.instant(assessment.available || '-')
				},
				furtherInvestigations: null,
				expectedReturn: null
			};
			if (assessment.available && assessment.available === 'no') {
				assessmentFields.furtherInvestigations = {
					label: this.translate.instant('medical.infirmary.assessments.further'),
					value: this.translate.instant(assessment.further === true ? 'Yes' : 'No')
				};
				if (!assessment.further && assessment.expectation) {
					assessmentFields.expectedReturn = {
						label: this.translate.instant('medical.infirmary.assessments.expectation'),
						value: toDateString(assessment.expectation)
					};
				}
			}
			return assessmentFields;
		});
	}

	private getDetails(injury: Injury): PdfBasicType[][] {
		return [
			[
				{
					label: this.translate.instant('medical.infirmary.details.issue'),
					value: injury.issue ? this.translate.instant(injury.issue) : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.injuryDate'),
					value: toDateString(injury.date)
				},
				{
					label: this.translate.instant('medical.infirmary.details.admissionDate'),
					value: toDateString(injury.admissionDate)
				},
				{
					label: this.translate.instant('OSIICS Code'),
					value: injury.osics || '-'
				},
				{
					label: this.translate.instant('OSIICS Description'),
					value: this.osicsService.getOSICSDiagnosis(injury.osics) || '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.system'),
					value: injury.system ? injury.system.map(s => this.translate.instant(s)).join(', ') : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.location'),
					value: injury.location ? this.translate.instant(injury.location) : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.anatomicalDetails'),
					value: injury.anatomicalDetails
						? injury.anatomicalDetails.map(s => this.translate.instant(s)).join(', ')
						: '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.type'),
					value: injury.type ? injury.type.map(s => this.translate.instant(s)).join(', ') : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.reInjury'),
					value: this.translate.instant(injury.reinjury ? 'yes' : 'no')
				},
				{
					label: this.translate.instant('medical.infirmary.details.category'),
					value: injury.category ? this.translate.instant(injury.category) : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.contact'),
					value: this.translate.instant(injury.contact ? 'yes' : 'no')
				},
				{
					label: this.translate.instant('medical.infirmary.details.mechanism'),
					value: injury.mechanism ? this.translate.instant(injury.mechanism) : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.occurrence'),
					value: injury.occurrence ? this.translate.instant(injury.occurrence) : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.severity'),
					value: injury.severity ? this.translate.instant(injury.severity) : '-'
				}
			],
			[
				{
					label: this.translate.instant('medical.infirmary.details.currentStatus'),
					value: injury.currentStatus ? this.translate.instant(injury.currentStatus) : '-'
				},
				{
					label: this.translate.instant('medical.infirmary.details.daysCurrentStatus'),
					value: getDaysCurrentStatus(injury)
				},
				{
					label: this.translate.instant('medical.infirmary.details.expectedReturn'),
					value: toDateString(injury.expectedReturn)
				}
			],
			[
				{
					label: this.translate.instant('medical.infirmary.details.endDate'),
					value: toDateString(injury.endDate)
				},
				{
					label: this.translate.instant('medical.infirmary.details.daysFromInjury'),
					value: getDaysFrom(injury.date) * -1
				},
				{
					label: this.translate.instant('medical.infirmary.details.daysFromReturn'),
					value: getDaysFrom(injury.expectedReturn)
				}
			],
			[
				{
					label: this.translate.instant('medical.infirmary.details.diagnosis'),
					value: parseHtmlStringToText(injury.diagnosis)
				},
				{
					label: this.translate.instant('medical.infirmary.details.treatmentInstructions'),
					value: parseHtmlStringToText(injury.treatInstruction)
				},
				{
					label: this.translate.instant('medical.infirmary.details.notes'),
					value: parseHtmlStringToText(injury.notes)
				}
			]
		];
	}

	private getExams(injury: Injury): PdfMixedTable {
		return {
			headers: [
				{ mode: 'text', label: this.translate.instant('medical.infirmary.exam.date'), alignment: 'left' },
				{ mode: 'text', label: this.translate.instant('medical.infirmary.exam.hour'), alignment: 'center' },
				{ mode: 'text', label: this.translate.instant('medical.infirmary.exam.exam'), alignment: 'center' },
				{ mode: 'text', label: this.translate.instant('medical.infirmary.report.description'), alignment: 'center' }
			],
			rows: this.mapExams(injury)
		};
	}

	private mapExams(injury: Injury): MixedType[][] {
		return (injury._injuryExams || []).map(exam => [
			{
				mode: 'text',
				label: exam.date ? moment(exam.date).format(getMomentFormatFromStorage()) : '-',
				alignment: 'left'
			},
			{ mode: 'text', label: exam.date ? moment(exam.date).format('HH:mm') : '-', alignment: 'center' },
			{ mode: 'text', label: this.translate.instant(exam.exam || '-'), alignment: 'center' },
			{ mode: 'text', label: exam.description || '-', alignment: 'center' }
		]);
	}

	private getHistory(injury: Injury, durations: any[]): PdfMixedTable {
		return {
			headers: [
				{
					mode: 'text',
					label: this.translate.instant('medical.infirmary.details.history.headers.date'),
					alignment: 'left'
				},
				{
					mode: 'text',
					label: this.translate.instant('medical.infirmary.details.history.headers.phase'),
					alignment: 'center'
				},
				{
					mode: 'text',
					label: this.translate.instant('medical.infirmary.details.history.headers.author'),
					alignment: 'center'
				},
				{
					mode: 'text',
					label: this.translate.instant('medical.infirmary.details.history.headers.duration'),
					alignment: 'center'
				}
			],
			rows: (injury.statusHistory || []).map((status, index) => [
				{ mode: 'text', label: moment(status.date).format(getMomentFormatFromStorage()) ?? '-' },
				{ mode: 'text', label: this.translate.instant(status.phase) },
				{ mode: 'text', label: status.author },
				{ mode: 'text', label: durations[index] }
			])
		};
	}

	private getTreatments(
		injuryMedicalTreatments: MedicalTreatment[],
		customers: Customer[]
	): { sec: PdfMixedTable; med: PdfMixedTable; phy: PdfMixedTable } {
		const t = this.translate.instant.bind(this.translate);
		const currentTeam = this.currentTeamService.getCurrentTeam();
		const locationOptions = this.getLocationOptions();
		const injuryTypeOptions = this.getTypeOptions();
		const physiotherapyMetrics = this.getTreatmentMetrics().filter(({ type }) => type === 'physiotherapy');
		const secMetrics = this.getTreatmentMetrics().filter(({ type }) => type === 'sec');
		const secItems = injuryMedicalTreatments.filter(treatment => treatment.treatmentType === 'SeC');
		const medItems = injuryMedicalTreatments.filter(treatment => treatment.treatmentType === 'medicationSupplements');
		const phyItems = injuryMedicalTreatments.filter(treatment => treatment.treatmentType === 'physiotherapy');
		const sec: PdfMixedTable = {
			headers: TrtUtilsService.getSecHeadersForPDF(t).map(header => ({
				mode: 'text',
				label: header,
				alignment: 'center'
			})),
			rows: TrtUtilsService.getSecValuesForPDF(
				t,
				this.treatmentsTooltipPipe,
				this.customerNamePipe,
				this.selectItemLabelPipe,
				this.treatmentCompletePipe,
				secItems,
				locationOptions,
				secMetrics,
				customers
			).map(values => values.map(value => ({ mode: 'text', label: value, alignment: 'center' })))
		};
		const med: PdfMixedTable = {
			headers: TrtUtilsService.getMedSuppHeadersForPDF(t).map(header => ({
				mode: 'text',
				label: header,
				alignment: 'center'
			})),
			rows: TrtUtilsService.getMedSuppValuesForPDF(
				t,
				this.medicationLabelPipe,
				this.customerNamePipe,
				this.selectItemLabelPipe,
				this.treatmentCompletePipe,
				currentTeam,
				medItems,
				locationOptions,
				customers
			).map(values => values.map(value => ({ mode: 'text', label: value, alignment: 'center' })))
		};
		const phy: PdfMixedTable = {
			headers: TrtUtilsService.getPhyHeadersForPDF(t).map(header => ({
				mode: 'text',
				label: header,
				alignment: 'center'
			})),
			rows: TrtUtilsService.getPhyValuesForPDF(
				t,
				this.treatmentsTooltipPipe,
				this.treatmentCategoriesTooltipPipe,
				this.customerNamePipe,
				this.selectItemLabelPipe,
				this.treatmentCompletePipe,
				phyItems,
				physiotherapyMetrics,
				locationOptions,
				injuryTypeOptions,
				customers
			).map(values => values.map(value => ({ mode: 'text', label: value, alignment: 'center' })))
		};
		return {
			sec,
			med,
			phy
		};
	}


	private getLocationOptions(): SelectItem[] {
		const locationOptions = this.constantService.getLocations().map(({ value, label }) => ({
			label: this.translate.instant(label),
			value: value
		}));
		return sortByName(locationOptions, 'label');
	}

	private getTreatmentMetrics(): TreatmentMetric[] {
		let { treatmentMetrics } = this.currentTeamService.getCurrentTeam();
		if (!treatmentMetrics || treatmentMetrics.length === 0) {
			treatmentMetrics = this.customTreatmentService.defaultTreatments();
		}
		return treatmentMetrics.filter(({ active }) => active);
	}

	private getTypeOptions(): SelectItem[] {
		let typeOptions = this.constantService.getTypes().map(({ value, label }) => ({
			label: this.translate.instant(label),
			value: value
		}));

		typeOptions = sortByName(typeOptions, 'label');
		typeOptions.unshift({
			label: this.translate.instant('none'),
			value: 'none'
		});
		return typeOptions;
	}
}

export interface InjuryDetailReportPDF extends PdfBase {
	headers: {
		details: string;
		history: string;
		assessments: string;
		exams: string;
		sec: string;
		med: string;
		phy: string;
	};
	summary: {
		playerImage: PdfBasicType;
		playerDisplayName: PdfBasicType;
		playerName: PdfBasicType;
		playerSurname: PdfBasicType;
		playerAge: PdfBasicType;
		playerWeight: PdfBasicType;
		playerHeight: PdfBasicType;
	};
	details: PdfBasicType[];
	details2: PdfBasicType[];
	details3: PdfBasicType[];
	details4: PdfBasicType[];
	bodyChartStyle: string;
	assessments: PDFAssessment[];
	historyTable: PdfMixedTable;
	examsTable: PdfMixedTable;
	treatmentsTable: {
		sec: PdfMixedTable;
		med: PdfMixedTable;
		phy: PdfMixedTable;
	};
	bodyChartLegend: any;
}

interface PDFAssessment {
	date: PdfBasicType;
	ROM: PdfBasicType;
	strength: PdfBasicType;
	stability: PdfBasicType;
	swelling: PdfBasicType;
	pain: PdfBasicType;
	functionality: PdfBasicType;
	notes: PdfBasicType;
	nextAssessment: PdfBasicType;
	highPriority: PdfBasicType;
	available: PdfBasicType;
	furtherInvestigations: PdfBasicType;
	expectedReturn: PdfBasicType;
}
