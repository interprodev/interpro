import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	Injury,
	InjuryAssessment,
	InjuryExam,
	MedicalTreatment,
	Player,
	TreatmentMetricType
} from '@iterpro/shared/data-access/sdk';
import {
	INJURY_STATUSES,
	InjuryStatus,
	OSICS,
	OsicsService,
	ReportService,
	getMedicationName,
	getMomentFormatFromStorage,
	parseHtmlStringToText,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);

export enum ReportViewState {
	Daily = 0,
	Period = 1
}

interface InjuryWithLastInfo extends Injury {
	lastAssessment: InjuryAssessment;
	lastExam: InjuryExam;
	lastTreatment: MedicalTreatment;
}

@UntilDestroy()
@Component({
	selector: 'iterpro-report',
	templateUrl: './report.component.html',
	styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit, OnChanges, OnDestroy {
	@Input() injuries: Injury[];
	@Input() medicalTreatments: MedicalTreatment[];
	@Input() customers: Customer[];
	injuriesWithPlayer: InjuryWithLastInfo[] = [];

	translations: any = {};

	public today: Date;
	public currentDay: Date;

	private emptyAssessment: InjuryAssessment = new InjuryAssessment({
		rom: '-',
		strength: '-',
		stability: '-',
		swelling: '-'
	});
	private emptyTreatment: MedicalTreatment = new MedicalTreatment({
		category: '-',
		description: '-',
		author: '-'
	});
	osicsList: OSICS[];

	constructor(
		private reportService: ReportService,
		private translateService: TranslateService,
		private osicsService: OsicsService,
		private currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.translateService
			.getTranslation(this.translateService.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(val => {
				this.translations = val;
				this.currentDay = moment().startOf('day').toDate();
				this.orderByDate();
			});
		this.osicsList = this.osicsService.getOSICSList();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['injuries'] || changes['medicalTreatments'])
			if (this.currentDay && this.medicalTreatments) {
				this.injuriesWithPlayer = [];
				this.orderByDate();
			}
	}

	ngOnDestroy() {
		this.injuriesWithPlayer = null;
	}

	private orderByDate() {
		this.injuriesWithPlayer = this.injuries.map((injury: InjuryWithLastInfo) => {
			injury._injuryAssessments = sortByDateDesc(injury._injuryAssessments, 'date');
			injury._injuryExams = sortByDateDesc(injury._injuryExams, 'date');
			const injuryMedicalTreatments = sortByDateDesc(
				(this.medicalTreatments || []).filter(({ injuryId }) => injuryId === injury.id),
				'date'
			);
			injury.lastAssessment = injury._injuryAssessments[0] || this.emptyAssessment;
			injury.lastExam = injury._injuryExams[0];
			injury.lastTreatment = injuryMedicalTreatments[0] || this.emptyTreatment;
			return injury;
		});
	}

	private getReportData() {
		const t = k => this.translations[k] || k;
		return this.injuriesWithPlayer.map(injury => ({
			name: injury.player.displayName,
			image: this.getPlayerPic(injury.player),
			color: this.getColorCode(injury),
			osics: {
				label: 'OSIICS',
				value: injury.osics ? `${injury.osics} - ${this.osicsService.getOSICSDiagnosis(injury.osics)}` : null
			},
			location: { label: t('medical.infirmary.report.location'), value: t(injury.location) },
			status: { label: t('medical.infirmary.report.status'), value: t(injury.currentStatus) },
			injuryDate: { label: t('medical.infirmary.report.injuryDate'), value: injury.date },
			expectedReturn: { label: t('medical.infirmary.report.expectedReturn'), value: injury.expectedReturn },
			diagnosis: { label: t('medical.infirmary.report.diagnosis'), value: parseHtmlStringToText(injury.diagnosis) },
			lastAssessmentDate: { label: t('medical.infirmary.report.date'), value: injury.lastAssessment?.date },
			rom: { label: t('medical.infirmary.report.rom'), value: t(injury.lastAssessment?.rom) },
			strength: { label: t('medical.infirmary.report.strength'), value: t(injury.lastAssessment?.strength) },
			stability: { label: t('medical.infirmary.report.stability'), value: t(injury.lastAssessment?.stability) },
			swelling: { label: t('medical.infirmary.report.swelling'), value: t(injury.lastAssessment?.swelling) },
			pain: { label: t('medical.infirmary.report.pain'), value: injury.lastAssessment?.pain },
			functionality: {
				label: t('medical.infirmary.report.functionality'),
				value: injury.lastAssessment.functionality
			},
			lastExam: {
				label: t('medical.infirmary.report.lastExam'),
				value: injury.lastExam?.date
			},
			type: { label: t('medical.infirmary.report.type'), value: t(this.getTreatmentType(injury.lastTreatment)) },
			description: {
				label: t('medical.infirmary.report.description'),
				value: t(this.getTreatmentName(injury.lastTreatment))
			},
			date: { label: t('medical.infirmary.report.date'), value: injury.lastTreatment?.date },
			hour: {
				label: t('medical.infirmary.report.hour'),
				value: moment(injury.lastTreatment?.date).format('HH:mm')
			},
			author: { label: t('medical.infirmary.report.author'), value: injury.lastTreatment?.author }
		}));
	}

	getReportCSV() {
		const data = this.getReportData();
		const d = date => (date ? moment(date).format(getMomentFormatFromStorage()) : '');
		const t = this.translateService.instant.bind(this.translateService);
		const headers = data.length
			? [
					t('general.player'),
					data[0].osics.label,
					data[0].location.label,
					data[0].status.label,
					data[0].injuryDate.label,
					data[0].expectedReturn.label,
					data[0].diagnosis.label,
					' ',
					t('medical.infirmary.report.lastAssessment'),
					data[0].lastAssessmentDate.label,
					data[0].rom.label,
					data[0].strength.label,
					data[0].stability.label,
					data[0].swelling.label,
					data[0].pain.label,
					data[0].functionality.label,
					data[0].lastExam.label,
					' ',
					t('medical.infirmary.report.lastTreatment'),
					data[0].type.label,
					data[0].description.label,
					data[0].date.label,
					data[0].hour.label,
					data[0].author.label
			  ]
			: [];
		const rows = data.map(item => [
			item.name,
			item.osics.value,
			item.location.value,
			item.status.value,
			d(item.injuryDate.value),
			d(item.expectedReturn.value),
			item.diagnosis.value,
			' ',
			' ',
			item.lastAssessmentDate.value,
			item.rom.value,
			item.strength.value,
			item.stability.value,
			item.swelling.value,
			item.pain.value,
			item.functionality.value,
			d(item.lastExam.value),
			' ',
			' ',
			item.type.value,
			item.description.value,
			d(item.date.value),
			item.hour.value,
			item.author.value
		]);
		this.reportService.getReportCSV('Infirmary Report', [headers, ...rows]);
	}

	getReport() {
		const data = this.getReportData();

		this.reportService
			.getImages(data.map(({ image }) => image))
			.pipe(untilDestroyed(this))
			.subscribe(images => {
				const reports = data.map((item, index) => ({ ...item, image: images[index] }));
				const date = moment().format(getMomentFormatFromStorage());
				this.reportService.getReport(
					'infirmary_report_v2',
					{ reports, date },
					'positions.HoM',
					null,
					'Infirmary Report'
				);
			});
	}

	private getColorCode({ currentStatus }: Injury): string {
		const injuryStatus: InjuryStatus = INJURY_STATUSES.find(({ label }) => label === currentStatus);
		return injuryStatus?.color;
	}

	getBorderColor(injury: Injury): string {
		return this.getColorCode(injury);
	}

	handleDateSelect(e) {
		this.currentDay = e;
	}

	getPlayerPic(player: Player): string {
		return player.downloadUrl;
	}

	getTreatmentType({ treatmentType }: MedicalTreatment): string {
		if (treatmentType === 'SeC') return 'prevention.treatments.sec';
		else if (treatmentType === 'medicationSupplements') return 'prevention.treatments.medicationSupplements';
		else if (treatmentType === 'physiotherapy') return 'prevention.treatments.physiotherapy';
	}

	getTreatmentName(medicalTreatment: MedicalTreatment): string {
		if (medicalTreatment.treatmentType === 'medicationSupplements') {
			return getMedicationName(medicalTreatment.drug, this.currentTeamService.getCurrentTeam());
		} else if (!!medicalTreatment.treatment && medicalTreatment.treatment.length > 0) {
			return medicalTreatment.treatment
				.map((treatment: string) => {
					const keyLabel =
						(medicalTreatment.treatmentType.toLowerCase() as TreatmentMetricType) === 'physiotherapy'
							? `medical.prevention.treatments.physiotherapy.options.${treatment}`
							: `medical.prevention.treatments.${medicalTreatment.treatmentType.toLowerCase()}.${treatment}`;
					return this.translateService.instant(keyLabel);
				})
				.join(', ');
		}
	}

	injuryByID(index: number, injury: Injury): string {
		return injury.id;
	}
}
