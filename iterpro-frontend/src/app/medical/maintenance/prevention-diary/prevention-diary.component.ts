import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Injury,
	MedicalPreventionPlayer,
	MedicalTreatment,
	PreventionExam,
	TestInstance,
	TreatmentMetric,
	TreatmentMetricType
} from '@iterpro/shared/data-access/sdk';
import {
	CustomTreatmentService,
	INJURY_STATUSES,
	InjuryStatusLabel,
	ReportService,
	getMedicationName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import chroma from 'chroma-js';
import { isArray } from 'lodash';
import * as moment from 'moment';
import { extendMoment } from 'moment-range';

const momentRange = extendMoment(moment);

interface DiaryRow {
	label: FieldType;
	icon: string;
	1: any[];
	2: any[];
	3: any[];
	4: any[];
	5: any[];
	6: any[];
	7: any[];
}
type FieldType = 'sec' | 'physio' | 'medications' | 'exams' | 'tests';
type InstanceType = MedicalTreatment | PreventionExam | TestInstance;

@UntilDestroy()
@Component({
	selector: 'iterpro-prevention-diary',
	templateUrl: './prevention-diary.component.html',
	styleUrls: ['./prevention-diary.component.scss']
})
export class PreventionDiaryComponent implements OnChanges, OnInit {
	@Input() medicalTreatments: MedicalTreatment[];
	@Input() player: MedicalPreventionPlayer;
	@Input() injuries: Injury[];
	@Input() tests: TestInstance[];

	@Output() onClickPrevention: EventEmitter<boolean> = new EventEmitter<boolean>();

	structure: DiaryRow[] = [];
	startWeek: string;
	period: any[];

	private start: moment.Moment;
	private secMetrics: TreatmentMetric[];
	private physiotherapyMetrics: TreatmentMetric[];

	constructor(
		private translate: TranslateService,
		private router: Router,
		private reportService: ReportService,
		private currentTeamService: CurrentTeamService,
		private customTreatmentService: CustomTreatmentService
	) {
		this.start = momentRange().startOf('isoWeek');
		this.startWeek = momentRange(this.start).year() + '-W' + ('0' + momentRange(this.start).isoWeek()).slice(-2);
		this.period = this.computePeriod(this.start);
	}

	ngOnInit() {
		let { treatmentMetrics } = this.currentTeamService.getCurrentTeam();
		if (!treatmentMetrics || treatmentMetrics.length === 0) {
			treatmentMetrics = this.customTreatmentService.defaultTreatments();
		}
		this.secMetrics = treatmentMetrics.filter((treatment: TreatmentMetric) => treatment.type === 'sec');
		this.physiotherapyMetrics = treatmentMetrics.filter(
			(treatment: TreatmentMetric) => treatment.type === 'physiotherapy'
		);
	}

	ngOnChanges() {
		this.init();
	}

	goToWeek(event) {
		this.start = momentRange(event.target.valueAsDate);
		this.period = this.computePeriod(this.start);
		this.init();
	}

	toWeekBefore() {
		this.start = momentRange(this.start).subtract(1, 'week');
		this.startWeek = momentRange(this.start).year() + '-W' + ('0' + momentRange(this.start).isoWeek()).slice(-2);
		this.period = this.computePeriod(this.start);
		this.init();
	}

	toWeekAfter() {
		this.start = momentRange(this.start).add(1, 'week');
		this.startWeek = momentRange(this.start).year() + '-W' + ('0' + momentRange(this.start).isoWeek()).slice(-2);
		this.period = this.computePeriod(this.start);
		this.init();
	}

	private computePeriod(start: moment.Moment) {
		return Array.from(
			momentRange.range(momentRange(start).startOf('isoWeek'), momentRange(start).endOf('isoWeek')).by('day')
		);
	}

	private init() {
		this.resetStructure();
		this.fillTreatmentType('SeC', 'sec');
		this.fillTreatmentType('physiotherapy', 'physio');
		this.fillTreatmentType('medicationSupplements', 'medications');
		this.fillExams(this.injuries, this.player._preventionExams);
		this.fillTests(this.tests);
	}

	private resetStructure() {
		this.structure = [
			{ label: 'sec', icon: 'fas fa-dumbbell', 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
			{ label: 'physio', icon: 'fas fa-hand-holding-heart', 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
			{ label: 'medications', icon: 'fas fa-vial', 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
			{ label: 'tests', icon: 'fas fa-eye', 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
			{ label: 'exams', icon: 'fas fa-notes-medical', 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
		];
	}

	private fillTreatmentType(
		treatmentType: 'SeC' | 'physiotherapy' | 'medicationSupplements',
		field: 'sec' | 'physio' | 'medications'
	) {
		let treatments: MedicalTreatment[] = [];
		treatments = [
			...this.medicalTreatments.filter(
				treat =>
					treat.treatmentType === treatmentType &&
					momentRange(treat.date).isBetween(this.period[0], this.period[6], 'day', '[]')
			)
		];
		this.structure = this.pushToStructure(this.structure, treatments, field);
	}

	private fillExams(injuries: Injury[], prevention: PreventionExam[]) {
		let exams: PreventionExam[] = [];
		injuries.forEach(x => {
			exams = [
				...exams,
				...x._injuryExams.filter(exam => momentRange(exam.date).isBetween(this.period[0], this.period[6], 'day', '[]'))
			];
		});
		exams = [
			...exams,
			...prevention.filter(exam => momentRange(exam.date).isBetween(this.period[0], this.period[6], 'day', '[]'))
		];
		this.structure = this.pushToStructure(this.structure, exams, 'exams');
	}

	private fillTests(tests: TestInstance[]) {
		const filteredTests = tests.filter(x => momentRange(x.date).isBetween(this.period[0], this.period[6], 'day', '[]'));
		this.structure = this.pushToStructure(this.structure, filteredTests, 'tests');
	}

	private pushToStructure(structure: DiaryRow[], collection: any[], field: FieldType) {
		collection.forEach(x => {
			const el = structure.find(({ label }) => label === field);
			const day = momentRange(x.date).isoWeekday();
			el[day] = [...el[day], x];
		});
		return structure;
	}

	getCompleteClass(element: any, label: string, icon: string): { class: string; color: string } {
		if (label === 'tests' || !!element.complete) return { class: icon, color: 'green' };

		return moment(element.date).isBefore(moment()) ? { class: icon, color: 'red' } : { class: icon, color: 'unset' };
	}

	private getLabel(items: TreatmentMetric[], value: string, empty: string = '-') {
		if (!items) return empty;
		const field = items.find(f => f.value === value);
		if (field && field.label) return field.label;
		return empty;
	}

	private getPlayerTreatmentMetrics(type: TreatmentMetricType) {
		return type === 'physiotherapy' ? this.physiotherapyMetrics : this.secMetrics;
	}

	getCompleteTitle(instance: InstanceType, label: FieldType): string {
		const defaultMetrics: TreatmentMetric[] = [];
		const customMetrics: TreatmentMetric[] = [];
		this.getPlayerTreatmentMetrics('sec').forEach(metric =>
			!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)
		);
		this.getPlayerTreatmentMetrics('physiotherapy').forEach(metric =>
			!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)
		);
		if (label === 'tests') {
			const test = instance as TestInstance;
			// @ts-ignore
			return test.name + ' - ' + test.purpose.map(x => this.translate.instant(x)).join(', ');
		} else if (label === 'exams') {
			const exam = instance as PreventionExam;
			return momentRange(instance.date).format('HH:mm') + ' - ' + exam;
		} else {
			const medicalTreatment = instance as MedicalTreatment;
			const type = medicalTreatment?.injuryId
				? this.translate.instant('medical.infirmary.details.issue.injury')
				: this.translate.instant('prevention.treatments.prescription');
			if (medicalTreatment.treatmentType === 'medicationSupplements') {
				const drug = isArray(medicalTreatment.drug) ? medicalTreatment.drug[0] : medicalTreatment?.drug;
				const medicationName = getMedicationName(drug, this.currentTeamService.getCurrentTeam());
				return (
					type +
					': ' +
					momentRange(medicalTreatment.date).format('HH:mm') +
					' - ' +
					(medicationName ? medicationName : '') +
					' - ' +
					(medicalTreatment?.drugDose ? medicalTreatment.drugDose : '')
				);
			} else {
				try {
					if (!!medicalTreatment.treatment && medicalTreatment.treatment.length > 0) {
						return medicalTreatment.treatment
							.map((tr: string) =>
								tr
									? !defaultMetrics.some(metric => tr === metric.category)
										? this.getLabel(customMetrics, tr, tr)
										: this.translate.instant(
												`medical.prevention.treatments.${medicalTreatment.treatmentType.toLowerCase()}.${tr}`
											)
									: ''
							)
							.join(', ');
					}
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error(medicalTreatment, e);
				}
			}
			return (
				type +
				': ' +
				momentRange(medicalTreatment.date).format('HH:mm') +
				' - ' +
				medicalTreatment?.treatment +
				' - ' +
				(medicalTreatment?.category ? medicalTreatment.category : '')
			);
		}
	}

	private getDescription(instance: InstanceType, label: FieldType): string {
		if (label === 'tests') {
			const test = instance as TestInstance;
			// @ts-ignore
			return test.name + ' - ' + test.purpose.map(x => this.translate.instant(x)).join(', ');
		} else if (label === 'exams') {
			return (instance as PreventionExam).exam;
		} else {
			const medicalTreatment = instance as MedicalTreatment;
			const basicLabel = medicalTreatment?.injuryId
				? this.translate.instant('medical.infirmary.details.issue.injury')
				: this.translate.instant('prevention.treatments.prescription');
			if (medicalTreatment.treatmentType === 'medicationSupplements') {
				const drug = isArray(medicalTreatment.drug) ? medicalTreatment.drug[0] : medicalTreatment?.drug;
				const medicationName = getMedicationName(drug, this.currentTeamService.getCurrentTeam());
				return `${medicationName} - ${medicalTreatment?.drugDose}`;
			} else {
				const treatmentLabel = this.translate.instant(
					'medical.prevention.treatments.' +
						medicalTreatment.treatmentType.toLowerCase() +
						'.' +
						medicalTreatment.treatment
				);
				return `${basicLabel} ${treatmentLabel} - ${medicalTreatment?.category}`;
			}
		}
	}

	getIconTitle(label: FieldType): string {
		switch (label) {
			case 'sec': {
				return this.translate.instant('prevention.treatments.sec');
			}
			case 'physio': {
				return this.translate.instant('prevention.treatments.physiotherapy');
			}
			case 'medications': {
				return this.translate.instant('prevention.treatments.medicationSupplements');
			}
			case 'tests': {
				return this.translate.instant('prevention.assessments.functionalTests');
			}
			case 'exams': {
				return this.translate.instant('medical.infirmary.exams');
			}
		}
	}

	/**
	 * => A player is injured if he has an injury with no end date or in phase healed.
	 * When any player is injured, the table header is underlined according to the color of injury 'currentstatus'(dropdown) if existent in that day of player.
	 * The background color got also the same color of injury 'currentstatus' (for example Therapy(white)/Rehab(Red)/Reconditioning(Yellow)/Returntoplay(Blue)/returntogame(Green))
	 *
	 * Using RGBA colors to change the opacity of an element background without affecting the child element(text/content) (parent element : table-cell and child element : element-container)
	 * @param date : period[i] i.e. table header date
	 */
	getColumnColor(date: moment.Moment): chroma.Color {
		if (date.isSameOrBefore(moment(), 'day')) {
			const injury: Injury = this.injuries.find(
				x =>
					(x.endDate && date.isBetween(moment(x.date), moment(x.endDate), 'day')) ||
					(!x.endDate && date.isSameOrAfter(moment(x.date), 'day'))
			);

			if (injury) {
				if (injury.issue === 'medical.infirmary.details.issue.injury') {
					const dateStatus = injury.statusHistory.find((status, index) => {
						if (index !== injury.statusHistory.length - 1) {
							return date.isBetween(moment(status.date), moment(injury.statusHistory[index + 1].date));
						}

						return true;
					});

					return chroma(
						INJURY_STATUSES.find(({ label }) => (dateStatus.phase as InjuryStatusLabel) === label).color
					).alpha(0.1);
				}
			}
		}

		return chroma('#fff').alpha(0);
	}

	getBorderColor(date: moment.Moment): string {
		if (date.isSameOrBefore(moment(), 'day')) {
			const injury: Injury = this.injuries.find(
				x =>
					(x.endDate && date.isBetween(moment(x.date), moment(x.endDate), 'day')) ||
					(!x.endDate && date.isSameOrAfter(moment(x.date), 'day'))
			);

			if (injury) {
				switch (injury.issue) {
					case 'medical.infirmary.details.issue.injury': {
						const dateStatus = injury.statusHistory.find((status, index) => {
							if (index !== injury.statusHistory.length - 1) {
								return date.isBetween(moment(status.date), moment(injury.statusHistory[index + 1].date));
							}

							return true;
						});

						return INJURY_STATUSES.find(({ label }) => (dateStatus.phase as InjuryStatusLabel) === label).color;
					}

					case 'medical.infirmary.details.issue.complaint':
						return 'yellow';
					case 'medical.infirmary.details.issue.illness':
						return 'purple';
					default:
						return 'transparent';
				}
			}
		}

		return 'transparent';
	}

	getTestLink(element: InstanceType) {
		if ('category' in element) {
			if (element.injuryId) {
				this.router.navigate(['/medical/infirmary', { id: (element as MedicalTreatment).injuryId }]);
			} else {
				this.onClickPrevention.emit(true);
			}
		} else if ('exam' in element) {
			// @ts-ignore
			this.router.navigate(['/medical/infirmary', { id: (element as PreventionExam).injuryId }]);
		} else if ('medical' in element) {
			const test = element as TestInstance;
			const params = {
				id: test.id,
				testId: test.testId
			};
			// @ts-ignore
			this.router.navigate([test.medical ? '/medical/examination' : '/performance/assessments', params]);
		}
	}

	downloadReport() {
		const headers = this.period.map(date => ({
			day: date.format('ddd DD, MMM'),
			color: this.getBorderColor(date)
		}));
		const events = [];
		const weekDays = week => [1, 2, 3, 4, 5, 6, 7].map(d => week[`${d}`]);
		const values = this.structure.map(week =>
			weekDays(week).map((day, dayIndex) =>
				day.map(icon => {
					const event = {
						date: headers[dayIndex],
						dateObj: icon.date,
						hour: icon.date && momentRange(icon.date).format('HH:mm'),
						type: this.getIconTitle(week.label),
						color: this.getCompleteClass(icon, week.label, week.icon).color,
						class: this.getCompleteClass(icon, week.label, week.icon).class,
						text: this.getCompleteTitle(icon, week.label),
						description: this.getDescription(icon, week.label),
						author: icon.author
					};
					events.push(event);
					return event;
				})
			)
		);

		events.sort((a, b) => {
			if (!a.dateObj) return 1;
			if (!b.dateObj) return -1;
			return a.dateObj - b.dateObj;
		});

		const t = this.translate.instant.bind(this.translate);

		const data = {
			player: this.player.displayName,
			image: this.player.downloadUrl,
			info: [
				{ label: t('profile.overview.nationality'), value: t(this.player.nationality) },
				{ label: t('Weight'), value: this.player.weight },
				{ label: t('Height'), value: this.player.height }
			],
			headers,
			values,
			events,
			eventsHeaders: [
				t('medical.infirmary.exam.date'),
				t('medical.infirmary.exam.hour'),
				t('medical.infirmary.report.type'),
				t('medical.infirmary.report.description'),
				t('medical.infirmary.report.author'),
				t('complete')
			]
		};

		this.reportService
			.getImage(data.image)
			.pipe(untilDestroyed(this))
			.subscribe(image => {
				this.reportService.getReport('maintenance_diary', Object.assign(data, { image }), 'positions.HoM');
			});
	}
}
