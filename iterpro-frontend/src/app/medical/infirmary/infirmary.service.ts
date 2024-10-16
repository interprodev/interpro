import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Injury, InjuryAssessment, LoopBackAuth, Player, TeamSeasonApi } from '@iterpro/shared/data-access/sdk';
import {
	ANATOMICAL_DETAILS,
	ANATOMICAL_DETAILS_LATIN,
	INJURY_STATUSES,
	getMomentFormatFromStorage,
	injuryCategories,
	injuryIssues,
	injuryMechanism,
	injuryOccurrence,
	injurySeverity,
	locations,
	sortByName,
	types
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { system as defaultSystems } from './../maintenance/ui/components/chronic-form/labels';

@UntilDestroy()
@Injectable({
	providedIn: 'root'
})
export class InfirmaryService {
	constructor(
		private currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private translate: TranslateService,
		private auth: LoopBackAuth
	) {}

	getPlayersObs(): Observable<Player[]> {
		const season = this.currentTeamService.getCurrentSeason();
		return this.teamSeasonApi
			.getPlayers(season.id, {
				include: {
					relation: 'injuries',
					scope: {
						order: 'date DESC'
					}
				},
				fields: [
					'name',
					'lastName',
					'displayName',
					'id',
					'teamId',
					'downloadUrl',
					'archived',
					'archivedDate',
					'birthDate',
					'nationality',
					'height',
					'weight',
					'jersey',
					'foot',
					'contractEnd',
					'valueField',
					'value',
					'position'
				],
				order: 'displayName DESC'
			})
			.pipe(untilDestroyed(this));
	}

	downloadEmptyCSV() {
		const headerObj = {};
		const eventProperties = Object.getOwnPropertyNames(Injury.getModelDefinition().properties);

		// leaving first column of header empty for numbering etc.
		headerObj['No.'] = '';
		headerObj['displayName'] = '';

		// Adding all properties except playerId to header of CSV.
		eventProperties.forEach(prop => {
			if (prop !== 'playerId') {
				// Do not include playerId as field as user can not enter this value.
				headerObj[prop] = '';
			}
		});

		const results = Papa.unparse([headerObj], {});
		const fileName = 'Injury_' + moment().format(getMomentFormatFromStorage()) + '_empty.csv';

		const contentDispositionHeader = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	getNewInjuryFromCSV(csvData: any, players: Player[]): Injury {
		const lastAssessment = this.getLastAssessment(csvData);
		const system = this.getSystems(csvData);
		const anatomicalDetails = this.getAnatomicalDetails(csvData);
		const type = this.getTypes(csvData);
		const location = this.getField(csvData.location, locations);
		const category = this.getField(csvData.category, injuryCategories);
		const mechanism = this.getField(csvData.mechanism, injuryMechanism);
		const occurrence = this.getField(csvData.occurrence, injuryOccurrence);
		const severity = this.getField(csvData.severity, injurySeverity);
		const currentStatus = this.getField(
			csvData.currentStatus,
			INJURY_STATUSES.map(({ label }) => ({ label, value: label }))
		);
		const issue = this.getField(csvData.issue, injuryIssues);
		const playerId = this.getPlayerId(csvData, players);
		return new Injury({
			createdBy: csvData.createdBy
				? csvData.createdBy
				: `${this.auth.getCurrentUserData().lastName} ${this.auth.getCurrentUserData().firstName}`,
			issue,
			date: csvData.date ? moment(csvData.date, 'DD/MM/YYYY HH:mm').toDate() : null,
			endDate: csvData.endDate ? moment(csvData.endDate, 'DD/MM/YYYY HH:mm').toDate() : null,
			admissionDate: csvData.admissionDate ? moment(csvData.admissionDate, 'DD/MM/YYYY HH:mm').toDate() : null,
			osics: csvData.osics,
			system,
			location,
			anatomicalDetails,
			type,
			reinjury: csvData.reinjury === 'true' ? true : false,
			category,
			contact: csvData.contact === 'true' ? true : false,
			mechanism,
			occurrence,
			severity,
			expectedReturn: csvData.expectedReturn ? moment(csvData.expectedReturn, 'DD/MM/YYYY HH:mm').toDate() : null,
			diagnosis: csvData.diagnosis || null,
			notes: csvData.notes || null,
			surgery: csvData.surgery === 'true' ? true : false,
			surgeryNotes: csvData.surgeryNotes || null,
			treatInstruction: csvData.treatInstruction || null,
			currentStatus,
			chronicInjuryId: csvData.chronicInjuryId ? csvData.chronicInjuryId : null,
			statusHistory: [],
			playerId,
			_injuryAssessments: [lastAssessment],
			_injuryExams: []
		});
	}

	private getLastAssessment(csvData) {
		return new InjuryAssessment({
			date: moment(csvData.lastAssessmentDate, getMomentFormatFromStorage()).toDate(),
			rom: csvData.lastAssessmentROM,
			strength: csvData.lastAssessmentStrength,
			stability: csvData.lastAssessmentStability,
			swelling: csvData.lastAssessmentSwelling,
			pain: csvData.lastAssessmentPain,
			functionality: csvData.lastAssessmentFunctionality,
			notes: csvData.lastAssessmentNotes,
			next: moment(csvData.lastAssessmentNext, getMomentFormatFromStorage()).toDate(),
			highPriority: csvData.lastAssessmentHighPriority,
			available: csvData.lastAssessmentAvailable.toLowerCase(),
			expectation: moment(csvData.lastAssessmentExpectation, getMomentFormatFromStorage()).toDate(),
			further: csvData.lastAssessmentFurther
		});
	}

	private getStandardAnatomicalDetails(): SelectItem[] {
		let anatomicalDetails =
			this.translate.currentLang === 'en-US' || this.translate.currentLang === 'de-DE'
				? ANATOMICAL_DETAILS
				: ANATOMICAL_DETAILS_LATIN;
		anatomicalDetails = sortByName(anatomicalDetails, 'label');
		anatomicalDetails = Array.from(anatomicalDetails.reduce((m, t) => m.set(t.value, t), new Map()).values());
		return anatomicalDetails;
	}

	private getAnatomicalDetails(csvData: any): string[] {
		const anatomicalDetails = this.getStandardAnatomicalDetails();
		const anatomicalDetailsFromCSV = this.getFieldFromCSV(csvData.anatomicalDetails, ',');
		const finalAnatomicalDetails = [];
		for (const detail of anatomicalDetailsFromCSV) {
			for (const defaultDetail of anatomicalDetails) {
				if (detail === defaultDetail.value.toLowerCase()) {
					finalAnatomicalDetails.push(defaultDetail.value);
				}
			}
		}
		return finalAnatomicalDetails;
	}

	private getSystems(csvData: any): string[] {
		const systemsFromCSV = this.getFieldFromCSV(csvData.system, ',');
		const finalSystems = [];
		for (const csvSystem of systemsFromCSV) {
			for (const defaultSystem of defaultSystems) {
				const cleanedString = this.getLastKey(defaultSystem);
				if (csvSystem === cleanedString) {
					finalSystems.push(defaultSystem);
				}
			}
		}
		return finalSystems;
	}

	private getTypes(csvData: any): string[] {
		const typesFromCSV = this.getFieldFromCSV(csvData.type, ',');
		const finalTypes = [];
		for (const csvType of typesFromCSV) {
			for (const defaultType of types) {
				const cleanedString = this.getLastKey(defaultType.value);
				if (csvType === cleanedString) {
					finalTypes.push(defaultType.label);
				}
			}
		}
		return finalTypes;
	}

	private getField(field: string, collections: SelectItem<string>[]): string {
		for (const location of collections) {
			const cleanedString = this.getLastKey(location.value);
			if (cleanedString === this.camelize(field).toLowerCase()) {
				return location.value;
			}
		}
	}

	private getLastKey(key: string): string {
		return key.split('.').reverse()[0].toLowerCase().trim();
	}

	private getPlayerId(csvData: any, players: Player[]): string {
		const displayName = csvData.displayName;
		const found = players.find(player => player.displayName === displayName);
		return found ? found.id : null;
	}

	private getFieldFromCSV(text: string, char: string): string[] {
		return text.split(char).map(element => element.trim().toLowerCase());
	}

	private camelize(str: string): string {
		return str
			.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
				return index === 0 ? word.toLowerCase() : word.toUpperCase();
			})
			.replace(/\s+/g, '');
	}
}
