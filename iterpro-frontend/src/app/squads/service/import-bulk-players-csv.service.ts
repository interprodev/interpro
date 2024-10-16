import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { LoopBackAuth, Player, Team, TeamApi, Threshold } from '@iterpro/shared/data-access/sdk';
import { CsvTable } from '@iterpro/shared/ui/components';
import { NATIONALITIES, SportType, getPositions } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { PlayersService } from 'src/app/shared/players/services/players.service';
import { headers } from 'src/app/shared/players/utils/headers';
import { FederalMembership } from '../squads-person/squads-person-details/squads-person-details.component';
import { CsvColumnNames } from './csv-column-names.service';

export const tableHeaders = [
	headers.ROW_INDEX,
	headers.DISPLAY_NAME,
	headers.FIRST_NAME,
	headers.LAST_NAME,
	headers.BIRTH_DATE,
	headers.YEAR,
	headers.AGE,
	headers.NATIONALITY,
	headers.BIRTH_PLACE,
	headers.TEAM,
	headers.POSITION,
	headers.MEMBERSHIP_TEAM,
	headers.FIRST_MEMBERSHIP_TEAM,
	headers.FIRST_MEMBERSHIP_PRO,
	headers.FEDERAL_ID,
	headers.ARCHIVED_DATE,
	headers.EMAIL,
	headers.PHONE_NUMBER,
	headers.GENDER,
	headers.EDUCATION,
	headers.NATIONALITY_ORIGIN,
	headers.MARITAL_STATUS,
	headers.WEIGHT,
	headers.HEIGHT,
	headers.FOOT,
	headers.SHOE_SIZE,
	headers.JERSEY_NUMBER,
	headers.CAPTAIN,
	headers.STREET,
	headers.CITY,
	headers.STATE,
	headers.ZIP,
	headers.COUNTRY,
	headers.BANK,
	headers.ACCOUNT_NUMBER,
	headers.ROUTING_NUMBER,
	headers.IBAN,
	headers.SWIFT,
];

interface I18Position {
	term: string;
	translated: any;
}

@Injectable({
	providedIn: 'root'
})
export class ImportBulkPlayersCsv {
	private positions: I18Position[];
	private teams: Array<Pick<Team, 'name' | 'id'>>;
	sportType: SportType;

	constructor(
		private playersService: PlayersService,
		private authService: LoopBackAuth,
		private teamApi: TeamApi,
		private translate: TranslateService,
		private store$: Store<RootStoreState>
	) {
		this.store$.select(AuthSelectors.selectSportType).subscribe({ next: (type: SportType) => (this.sportType = type) });
	}

	csvIsValid(data: any[], columnNames: CsvColumnNames) {
		if (data.length > 0) {
			const rowKeys = Object?.keys(data[0]);
			const columnValues = Object?.values(columnNames);
			return rowKeys.every(key => columnValues.indexOf(key) > -1);
		}
		return true;
	}

	csvToPlayerTable(
		csvData: any[],
		csvColumnNames: CsvColumnNames,
		defaultThresholds: Threshold[] = []
	): Observable<CsvTable> {
		this.initPositions();
		const _thresholds = this.initThresholds(defaultThresholds);
		const defaultPlayer = this.defaultPlayer();

		const players: Player[] = csvData.map(
			csvDataElement =>
				new Player({
					...defaultPlayer,
					name: csvDataElement[csvColumnNames.name],
					lastName: csvDataElement[csvColumnNames.surname],
					displayName: csvDataElement[csvColumnNames.displayName],
					nationality: csvDataElement[csvColumnNames.nationality],
					birthDate: csvDataElement[csvColumnNames.birthDate],
					birthPlace: csvDataElement[csvColumnNames.birthPlace],
					teamId: csvDataElement[csvColumnNames.team],
					position: csvDataElement[csvColumnNames.position],
					federalId: csvDataElement[csvColumnNames.federalId],
					archivedDate: csvDataElement[csvColumnNames.archivedDate],
					_thresholds,
					...this.federalMembership(csvDataElement, csvColumnNames),
					email: csvDataElement[csvColumnNames.email],
					phone: csvDataElement[csvColumnNames.phone],
					gender: csvDataElement[csvColumnNames.gender],
					education: csvDataElement[csvColumnNames.education],
					nationalityOrigin: csvDataElement[csvColumnNames.nationalityOrigin],
					maritalStatus: csvDataElement[csvColumnNames.maritalStatus],
					weight: csvDataElement[csvColumnNames.weight],
					height: csvDataElement[csvColumnNames.height],
					foot: csvDataElement[csvColumnNames.foot],
					shoeSize: csvDataElement[csvColumnNames.shoeSize],
					jersey: csvDataElement[csvColumnNames.jerseyNumber],
					captain: csvDataElement[csvColumnNames.captain],
					address: {
						street: csvDataElement[csvColumnNames.street],
						city: csvDataElement[csvColumnNames.city],
						state: csvDataElement[csvColumnNames.state],
						zipCode: csvDataElement[csvColumnNames.zipCode],
						nation: csvDataElement[csvColumnNames.country],
					},
					bankAccount: {
						bank: csvDataElement[csvColumnNames.bank],
						accountNumber: csvDataElement[csvColumnNames.accountNumber],
						routingNumber: csvDataElement[csvColumnNames.routingNumber],
						iban: csvDataElement[csvColumnNames.iban],
						swift: csvDataElement[csvColumnNames.swift],
					}
				})
		);
		return this.getTeamData().pipe(
			map((teams: Team[]) => {
				this.teams = teams.map(x => ({ name: x.name.replace(/\s/g, '').toLowerCase(), id: x.id }));
				return this.createTable(players, teams);
			})
		);
	}

	rawDataToPlayer(rawData: any, defaultThresholds: Threshold[] = []) {
		this.initPositions();
		const _thresholds = this.initThresholds(defaultThresholds);
		const defaultPlayer = this.defaultPlayer();
		const players: Player[] = rawData.rows.map(
			(row: any) =>
				new Player({
					...defaultPlayer,
					name: row.FIRST_NAME,
					lastName: row.LAST_NAME,
					displayName: row.DISPLAY_NAME,
					nationality: row.NATIONALITY,
					birthDate: row.BIRTH_DATE ? moment(row.BIRTH_DATE, 'DD/MM/YYYY HH:mm').toDate() : null,
					birthPlace: row.BIRTH_PLACE,
					teamId: row.TEAM ? this.getTeamId(row.TEAM) : defaultPlayer.teamId,
					position: this.translatePosition(row.POSITION),
					federalId: row.FEDERAL_ID,
					archivedDate: row.ARCHIVED_DATE ? moment(row.ARCHIVED_DATE, 'DD/MM/YYYY HH:mm').toDate() : null,
					archived: !!row.ARCHIVED_DATE && (row.ARCHIVED_DATE as string).trim().length > 0,
					_thresholds,
					...this.federalMembership(row, {
						membershipTeam: 'MEMBERSHIP_TEAM',
						firstMembershipTeam: 'FIRST_MEMBERSHIP_TEAM',
						firstMembershipPro: 'FIRST_MEMBERSHIP_PRO'
					}),
					email: row.EMAIL,
					phone: row.PHONE_NUMBER,
					gender: row.GENDER,
					education: row.EDUCATION,
					nationalityOrigin: row.NATIONALITY_ORIGIN,
					maritalStatus: row.MARITAL_STATUS,
					weight: row.WEIGHT,
					height: row.HEIGHT,
					foot: row.FOOT,
					shoeSize: row.SHOE_SIZE,
					jersey: row.JERSEY_NUMBER,
					captain: row.CAPTAIN,
					address: {
						street: row.STREET,
						city: row.CITY,
						state: row.STATE,
						zipCode: row.ZIP,
						nation: row.COUNTRY
					},
					bankAccount: {
						bank: row.BANK,
						accountNumber: row.ACCOUNT_NUMBER,
						routingNumber: row.ROUTING_NUMBER,
						iban: row.IBAN,
						swift: row.SWIFT
					}
				})
		);

		return players;
	}

	private createTable(players: Player[], teams: Team[]) {
		const currentTeamId = this.authService.getCurrentUserData().currentTeamId;
		players.forEach(player => {
			player.teamId = this.getTeamId(player.teamId) || currentTeamId;
		});
		const table: CsvTable = this.playersService.toTable(
			{ people: players, type: 'player' },
			tableHeaders.map(({ field }: { field: string }) => field),
			{
				teams
			},
			false
		) as CsvTable;
		table.headers.forEach(({ header }) => {
			header.validator = this.validatorsForFields(header.field);
		});
		return table;
	}

	private federalMembership(
		csvDataElement: any,
		{ membershipTeam, firstMembershipTeam, firstMembershipPro }: Partial<CsvColumnNames>
	) {
		const federalMembership: FederalMembership[] = [];
		let federalMembershipItem: FederalMembership;
		if (membershipTeam) {
			federalMembershipItem = new FederalMembership();
			federalMembershipItem.details = 'membershipTeam';
			federalMembershipItem.from = csvDataElement[membershipTeam];
			federalMembership.push(federalMembershipItem);
		}

		if (firstMembershipTeam) {
			federalMembershipItem = new FederalMembership();
			federalMembershipItem.details = 'firstMembershipTeam';
			federalMembershipItem.issueDate = csvDataElement[firstMembershipTeam];
			federalMembership.push(federalMembershipItem);
		}

		if (firstMembershipPro) {
			federalMembershipItem = new FederalMembership();
			federalMembershipItem.details = 'firstMembershipPro';
			federalMembershipItem.issueDate = csvDataElement[firstMembershipPro];
			federalMembership.push(federalMembershipItem);
		}

		return { federalMembership };
	}

	private getTeamData() {
		const clubId = this.authService.getCurrentUserData().clubId;
		return this.teamApi.find({
			where: {
				clubId
			},
			fields: ['id', 'name']
		});
	}

	private validatorsForFields(field: string): ValidatorFn[] {
		const validators = [];
		switch (field) {
			case headers.DISPLAY_NAME.field:
				validators.push(Validators.minLength(2));
				validators.push(Validators.required);
				break;
			case headers.FIRST_NAME.field:
			case headers.LAST_NAME.field:
				validators.push(Validators.minLength(2));
				validators.push(Validators.pattern(/^(?:[\u00c0-\u01ffa-zA-Z '-]){2,}$/i));
				validators.push(Validators.required);
				break;
			case headers.BIRTH_DATE.field:
			case headers.FIRST_MEMBERSHIP_TEAM.field:
			case headers.FIRST_MEMBERSHIP_PRO.field:
			case headers.ARCHIVED_DATE.field:
				validators.push(
					Validators.maxLength(10),
					Validators.pattern(/((0[1-9]|[12]\d|3[01])[/-](0[1-9]|1[0-2])[/-][12]\d{3})/)
				);
				break;
			case headers.MEMBERSHIP_TEAM.field:
			case headers.BIRTH_PLACE.field:
				validators.push(Validators.minLength(2));
				break;
			case headers.NATIONALITY.field:
				validators.push(this.isValidNationality());
				validators.push(Validators.required);
				break;
			case headers.POSITION.field:
				validators.push(this.isValidPosition());
				break;
			case headers.TEAM.field:
				validators.push(this.isValidTeam());
				break;
			case headers.EMAIL.field:
				validators.push(Validators.email);
				break;
			case headers.GENDER.field:
				validators.push(Validators.pattern(/^(male|female)$/i));
				break;
			case headers.JERSEY_NUMBER.field:
				validators.push(Validators.min(1));
				validators.push(Validators.max(99));
				break;
		}
		return validators;
	}
	private isValidNationality(): (c: AbstractControl) => { [key: string]: boolean } | null {
		return ({ value }: AbstractControl): { [key: string]: boolean } | null => {
			if (value.length > 0 && NATIONALITIES.map(item => item.value).indexOf(value.toUpperCase()) < 0) {
				return { nationality: true };
			}
			return null;
		};
	}

	private isValidPosition(): (c: AbstractControl) => { [key: string]: boolean } | null {
		return (c: AbstractControl): { [key: string]: boolean } | null => {
			const terms = this.positions.map(({ term }) => term.toUpperCase());
			const translations = this.positions.map(({ translated }) => translated.toUpperCase());
			const value = c.value.toUpperCase();
			if (value.length > 0) {
				if (terms.indexOf(value) < 0 && translations.indexOf(value) < 0) {
					return { position: true };
				}
			}
			return null;
		};
	}

	private isValidTeam(): (c: AbstractControl) => { [key: string]: boolean } | null {
		return (c: AbstractControl): { [key: string]: boolean } | null => {
			const value = c.value.replace(/\s/g, '').toLowerCase();
			if (value.length > 0) {
				const found = this.teams.find(x => x.name === value);
				if (!found) return { team: true };
			}
			return null;
		};
	}

	private translatePosition(position: string): string {
		const terms = this.positions.map(({ term }) => term.toUpperCase());
		if (position.length > 0 && terms.indexOf(position) < 0) {
			const translations = this.positions.map(({ translated }) => translated.toUpperCase());
			const index = translations.indexOf(position);
			position = index > -1 ? terms[index] : '';
		}
		return position;
	}

	private defaultPlayer() {
		return {
			wyscoutId: null,
			gpexeId: null,
			catapultId: null,
			fieldwizId: null,
			sonraId: null,
			statsportId: [],
			wimuId: null,
			captain: false,
			inTeamFrom: null,
			inTeamTo: null,
			otherMobile: [],
			birthDate: null,
			weight: null,
			height: null,
			role1: [],
			role2: [],
			role3: [],
			jersey: null,
			value: null,
			clubValue: null,
			agentValue: null,
			wage: null,
			contractStart: null,
			contractEnd: null,
			address: {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			},
			domicile: {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			},
			anamnesys: [],
			archived: false,
			archivedDate: null,
			statusDetails: [],
			movOnBall: [],
			movOffBall: [],
			passing: [],
			finishing: [],
			defending: [],
			technique: [],
			documents: [],
			federalMembership: [],
			email: '',
			phone: '',
			gender: null,
			education: null,
			nationalityOrigin: null,
			maritalStatus: null,
			foot: '',
			shoeSize: null,
			sportPassport: [],
			_statusHistory: [],
			deleted: false,
			bankAccount: {
				bank: '',
				routingNumber: '',
				accountNumber: '',
				swift: '',
				iban: '',
			},
			firstFederalMembership: null,
			teamId: this.authService.getCurrentUserData().currentTeamId,
			clubId: this.authService.getCurrentUserData().clubId,
			_thresholdsPlayer: []
		};
	}

	private initThresholds(defaultThresholds: Threshold[]) {
		return [
			{ name: 'GEN', thresholds: defaultThresholds },
			{ name: 'GD', thresholds: defaultThresholds }
		];
	}
	private initPositions() {
		this.positions = getPositions(this.sportType).map(item => ({
			term: item.value,
			translated: this.translate.instant(`${item.value}.short`)
		}));
	}

	private getTeamId(teamName) {
		const value = teamName.replace(/\s/g, '').toLowerCase();
		if (value.length > 0) {
			const found = this.teams.find(team => team.name === value);
			if (found) return found.id;
		}
		return null;
	}
}
