import { DatePipe, DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Agent, Anamnesys, Club, ContractPersonType, Player, Staff } from '@iterpro/shared/data-access/sdk';
import { CapitalizePipe, ShortNumberPipe, toShortNumber } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	FormatDateUserSettingPipe,
	NATIONALITIES,
	feeOptions,
	getMomentFormatFromStorage,
	wageOptions, isBase64Image
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { range, uniqBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { amortization, asset, headers, registry, salary } from '../utils/headers';

export interface PlayerTable {
	height: string;
	// frozenWidth: string;
	// scrollable: PlayerTableHeader[];
	// frozen: PlayerTableHeader[];
	headers: PlayerTableHeader[];
	rows: PlayerRow[];
}
export interface PlayerHeader {
	field: string;
	key: string;
	filterKey?: string;
	sortable: boolean;
	class?: string;
	csvRaw?: boolean;
	pdfRaw?: boolean;
	csvDisabled?: boolean;
	frozen?: boolean;
	width?: number;
}

export interface PlayerTableHeader {
	value: string;
	header: PlayerHeader;
}
export interface PlayerRow {
	player: Player | Staff | Agent;
	team: string;
	cells: PlayerTableCell[];
	fields: any;
}
export interface PlayerTableCell {
	field: string;
	type: string;
	value: any;
	raw?: any;
	class?: string;
}

const text = (field, value, raw?) => ({
	field,
	type: 'text',
	value,
	raw,
	class: 'tw-text-center'
});

export interface SquadPlayerOptions {
	teams: SelectItem[];
	status: SelectItem[];
	seasons: SelectItem[];
	roles: SelectItem[];
	contractNotarizationStatus: SelectItem[];
	registry: SelectItem[];
	salary: SelectItem[];
	asset: SelectItem[];
	amortization: SelectItem[];
	birthYears: SelectItem[];
	nationalities: SelectItem[];
	origins: SelectItem[];
	age: { min: number; max: number };
	contractTypes: SelectItem[];
	contractExpiryYear: SelectItem[];
	transferWages: SelectItem[];
	transferFees: SelectItem[];
	positions: SelectItem[];
}

@Injectable({
	providedIn: 'root'
})
export class PlayersService {
	constructor(
		private translate: TranslateService,
		private azurePipe: AzureStoragePipe,
		private millionsPipe: ShortNumberPipe,
		private numberPipe: DecimalPipe,
		private capitalize: CapitalizePipe,
		private datePipe: DatePipe,
		private formatDateUserSettingPipe: FormatDateUserSettingPipe,
		private currentTeamService: CurrentTeamService
	) {}

	getOptions(club: Club, rows: PlayerRow[]): SquadPlayerOptions {
		const yearMin = 8;
		const yearMax = 40;
		const currentYear = new Date().getFullYear();
		return {
			teams: club ? club.teams.map(team => ({ label: team.name, value: team.id })) : [],
			seasons: club ? club.clubSeasons.map(season => ({ label: season.name, value: season.id })) : [],
			status: [
				{ value: 'active', label: this.t('admin.contracts.active') },
				{ value: 'archived', label: this.t('profile.status.archived') }
			],
			contractNotarizationStatus: [
				{
					value: 'outwardContractNotarized',
					label: `${this.t('admin.contracts.outward')} - ${this.t('admin.contracts.validated')}`
				},
				{
					value: 'outwardContractNOTNotarized',
					label: `${this.t('admin.contracts.outward')} - ${this.t('admin.contracts.notValidated')}`
				},
				{
					value: 'inwardContractNotarized',
					label: `${this.t('admin.contracts.inward')} - ${this.t('admin.contracts.validated')}`
				},
				{
					value: 'inwardContractNOTNotarized',
					label: `${this.t('admin.contracts.inward')} - ${this.t('admin.contracts.notValidated')}`
				},
				{
					value: 'currentContractNotarized',
					label: `${this.t('admin.contracts')} - ${this.t('admin.contracts.validated')}`
				},
				{
					value: 'currentContractNOTNotarized',
					label: `${this.t('admin.contracts')} - ${this.t('admin.contracts.notValidated')}`
				}
			],
			roles: [
				{ value: 'Player' as ContractPersonType, label: this.t('admin.squads.element.players') },
				{ value: 'Staff' as ContractPersonType, label: this.t('admin.squads.element.staff') },
				{ value: 'Agent' as ContractPersonType, label: this.t('admin.squads.element.agents') }
			],
			age: { min: yearMin, max: yearMax },
			birthYears: range(currentYear, 1979).map(y => ({ label: String(y), value: y })),
			nationalities: NATIONALITIES.map((nationality: SelectItem) => {
				return {
					label: this.t(nationality.label),
					value: nationality.value,
					class: `flag-icon-${nationality.value.toLowerCase()}`
				};
			}),
			registry: registry.map(item => ({ value: item.field, label: this.t(item.filterKey || item.key) })),
			salary: salary.map(item => ({ value: item.field, label: this.t(item.filterKey || item.key) })),
			asset: asset.map(item => ({ value: item.field, label: this.t(item.filterKey || item.key) })),
			amortization: amortization.map(item => ({ value: item.field, label: this.t(item.filterKey || item.key) })),
			origins: [
				{ value: 'abroad', label: 'nationalityOrigins.abroadCommunitary' },
				{ value: 'abroadExtra', label: 'nationalityOrigins.abroadExtraCommunitary' },
				{ value: 'domestic', label: 'nationalityOrigins.domestic' },
				{ value: 'homegrown', label: 'nationalityOrigins.homegrown' }
			].map(item => ({
				value: item.value,
				label: this.t(item.label)
			})),
			contractTypes: [
				{ label: 'admin.contracts.origin.freeTransfer', value: 'freeTransfer' },
				{ label: 'admin.contracts.origin.purchased', value: 'purchased' },
				{ label: 'admin.contracts.origin.inTeamOnLoan', value: 'inTeamOnLoan' },
				{ label: 'admin.contracts.origin.homegrown', value: 'homegrown' },
				{ label: 'admin.contracts.type.sell', value: 'sell' },
				{ label: 'admin.contracts.type.onLoan', value: 'onLoan' }
			].map(item => ({
				value: item.value,
				label: this.t(item.label)
			})),
			contractExpiryYear: range(2016, 2036).map(y => ({ label: String(y), value: y })),
			positions: uniqBy(
				// @ts-ignore
				rows.map(({ player }) => ({ label: this.t(player.position), value: player.position })),
				'value'
			),
			transferFees: uniqBy(
				feeOptions
					.filter(value => value !== null && value !== undefined)
					.map((value: number) => ({
						label: toShortNumber(value, true),
						value
					})),
				'value'
			),
			transferWages: uniqBy(
				wageOptions
					.filter(value => value !== null && value !== undefined)
					.map((value: number) => ({
						label: toShortNumber(value, true),
						value
					})),
				'value'
			)
		};
	}

	toTable(filtered, fields: string[], club: any, serverSorted = true): PlayerTable {
		const people = filtered.people;
		const type = filtered.type;
		const selectedFields = [...fields];
		// IT-3825 make display name dynamic
		// if (selectedFields.indexOf(headers.DISPLAY_NAME.field) < 0) selectedFields.push(headers.DISPLAY_NAME.field);
		if (selectedFields.indexOf(headers.SELECTABLE.field) < 0) selectedFields.push(headers.SELECTABLE.field);
		const tableHeaders: PlayerTableHeader[] = selectedFields.map(field => ({
			value:
				!!headers[field].key && typeof headers[field].key === 'string'
					? this.translate.instant(headers[field].key)
					: !!headers[field].key && !!headers[field].key.key
					? this.translate.instant(headers[field].key.key, headers[field].key.params)
					: '',
			header: { ...headers[field], frozen: !!headers[field].frozen }
		}));
		// const scrollable = tableHeaders.filter(h => !h.header.frozen);
		// const frozen = tableHeaders.filter(h => h.header.frozen);
		const height = selectedFields.includes(headers.IMAGE.field) ? '70px' : '30px';
		// const frozenWidth = `${frozen.reduce((sum, h) => sum + (h.header.width || 150), 0)}px`;
		const rows = people.map((player, i) => {
			const team = club.teams.find(t => t.id === player.teamId);
			const teamName = team ? team.name : '';
			const data = { team, club };
			const rowFields = {};
			const cells = [];
			selectedFields.forEach(field => {
				const cell = this.getSecuredCell(player, type, field, i + 1, data, club);
				cells.push(cell);
				rowFields[field] = cell;
			});
			return {
				player,
				cells,
				team: teamName,
				fields: rowFields
			};
		});
		if (!serverSorted) {
			rows.sort((a, b) => {
				let sortIndex = a.team.localeCompare(b.team);
				if (sortIndex === 0 && !!a.player.displayName && !!b.player.displayName) {
					sortIndex = a.player.displayName.localeCompare(b.player.displayName);
				}
				return sortIndex;
			});
		}
		return {
			height,
			headers: tableHeaders,
			rows
		};
	}

	toCSV(table: PlayerTable) {
		const csvHeader = header => !header.header.csvDisabled;
		const csvCell = cell => !headers[cell.field].csvDisabled;
		const csvValue = cell => (headers[cell.field].csvRaw ? cell.raw : cell.value);
		const rows = [
			table.headers.filter(csvHeader).map(h => h.value),
			...table.rows.map(row => row.cells.filter(csvCell).map(csvValue))
		];
		return rows;
	}

	private getSecuredCell(player, type: string, field: string, index: number, data: any, club): PlayerTableCell {
		try {
			return this.getCell(player, type, field, index, data, club);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error('Error rendering cell', player, type, field);
			return text(field, '');
		}
	}

	private getCell(person: any, type: string, field: string, index: number, data: any, club): PlayerTableCell {
		switch (field) {
			case headers.SELECTABLE.field:
				return {
					field,
					type: 'select',
					value: false,
					class: 'tw-text-center'
				};
			case headers.ROW_INDEX.field:
				return {
					field,
					type: 'index',
					value: index,
					class: 'tw-text-center'
				};
			case headers.IMAGE.field:
				return {
					field,
					type: 'image',
					value: person.downloadUrl,
					class: 'pt-pic'
				};
			case headers.DISPLAY_NAME.field:
				return {
					field,
					type: 'text',
					value: person.displayName
				};
			case headers.TEAM.field: {
				return {
					field,
					type: 'text',
					value: data.team.name
				};
			}
			case headers.FIRST_NAME.field:
				return {
					field,
					type: 'text',
					value: (person as any).firstName || person.name
				};
			case headers.LAST_NAME.field:
				return {
					field,
					type: 'text',
					value: person.lastName
				};
			case headers.POSITION.field: {
				let position = person.position;
				if (type === 'player') {
					position = position ? this.t(`${position}.short`) : '';
					position = `${person.position}.short` === position ? person.position : position;
				} else {
					position = this.t(position);
				}
				return text(field, position, person.position);
			}
			case headers.FOOT.field:
			case headers.HAND.field:
				return text(field, this.capitalize.transform(this.t(person.foot)), person.foot);
			case headers.BIRTH_DATE.field: {
				const momentDate = person.birthDate
					? moment(person.birthDate, `${getMomentFormatFromStorage()} hh:mm`)
					: undefined;
				return text(
					field,
					!!momentDate && momentDate.isValid()
						? this.formatDateUserSettingPipe.transform(momentDate.toDate())
						: person.birthDate,
					person.birthDate
				);
			}
			case headers.BIRTH_PLACE.field:
				return {
					field,
					type: 'text',
					value: person.birthPlace
				};
			case headers.MEMBERSHIP_TEAM.field:
				return {
					field,
					type: 'text',
					value: person.membershipTeam
				};
			case headers.FIRST_MEMBERSHIP_PRO.field:
				return this.formatMembership(person.firstMembershipPro, field);
			case headers.FIRST_MEMBERSHIP_TEAM.field:
				return this.formatMembership(person.firstMembershipTeam, field);
			case headers.YEAR.field:
				return text(field, person.birthYear || '', person.birthYear);
			case headers.AGE.field: {
				return text(field, person.age || '', person.age);
			}
			case headers.MEDICAL_SCREENING_EXPIRY_DATES.field:
				return this.formatNextMedicalScreeningExpiryDates(person.medicalRecord, field);
			case headers.DOCUMENT_EXPIRY_DATES.field:
				// recupera tempi di notifica
				return this.formatDocumentExpiryDates(person.documents, person.documentStatus, field);
			case headers.NATIONALITY.field:
				return {
					field,
					type: 'flag',
					value: person.nationality,
					class: 'tw-text-center'
				};
			case headers.PASSPORT.field:
				return {
					field,
					type: 'flag',
					value: person.passport,
					class: 'tw-text-center'
				};
			case headers.FISCAL_ISSUE.field:
				return text(field, person.fiscalIssue);
			case headers.CONTRACT.field:
				return text(
					field,
					!!person.contract && person.contract.length > 0 ? this.t('admin.contracts.type.' + person.contract) : ''
				);
			case headers.CONTRACT_FROM.field:
				return text(
					field,
					this.getPlayerContractDate(person, true),
					this.getPlayerContractDate(person, true, 'yyyy/MM/dd')
				);
			case headers.CONTRACT_TO.field:
				return text(
					field,
					this.getPlayerContractDate(person, false),
					this.getPlayerContractDate(person, false, 'yyyy/MM/dd')
				);
			case headers.OUTWARD_CONTRACT_NOTARIZATION.field:
				return this.formatContractTypeNotarization(person?.outwardContractNotarized, field);
			case headers.INWARD_CONTRACT_NOTARIZATION.field:
				return this.formatContractTypeNotarization(person?.inwardContractNotarized, field);
			case headers.CURRENT_CONTRACT_NOTARIZATION.field:
				return this.formatContractTypeNotarization(person?.currentContractNotarized, field);
			case headers.ORIGIN.field:
				return text(field, this.t(person.origin));
			case headers.FEDERAL_ID.field:
				return text(field, person.federalId);
			case headers.CLUB.field: {
				return text(field, person.club);
			}
			case headers.VALUE.field: {
				return this.getCurrencyValue(person.value, field);
			}
			case headers.CARD_ID.field: {
				return text(field, person.idCard);
			}
			case headers.PASSPORT_NUMBER.field: {
				return text(field, person.passport);
			}
			case headers.MOBILE_PHONE_NUMBER.field:
				return text(field, person.mobilePhone);
			case headers.PHONE_NUMBER.field:
				return text(field, person.phone);
			case headers.EMAIL.field:
				return text(field, person.email);
			case headers.GENDER.field:
				return text(field, person.gender);
			case headers.EDUCATION.field:
				return text(field, person.education);
			case headers.NATIONALITY_ORIGIN.field:
				return text(field, person.nationalityOrigin);
			case headers.MARITAL_STATUS.field:
				return text(field, person.maritalStatus);
			case headers.WEIGHT.field:
				return text(field, person.weight);
			case headers.HEIGHT.field:
				return text(field, person.height);
			case headers.FOOT.field:
				return text(field, person.foot);
			case headers.SHOE_SIZE.field:
				return text(field, person.shoeSize);
			case headers.JERSEY_NUMBER.field:
				return text(field, person.jersey);
			case headers.CAPTAIN.field:
				return text(field, person.captain);
			case headers.STREET.field:
				return text(field, person.address.street);
			case headers.CITY.field:
				return text(field, person.address.city);
			case headers.STATE.field:
				return text(field, person.address.state);
			case headers.ZIP.field:
				return text(field, person.address.zipCode);
			case headers.COUNTRY.field:
				return text(field, person.address.nation);
			case headers.BANK.field:
				return text(field, person.bankAccount.bank);
			case headers.ACCOUNT_NUMBER.field:
				return text(field, person.bankAccount.accountNumber);
			case headers.ROUTING_NUMBER.field:
				return text(field, person.bankAccount.routingNumber);
			case headers.IBAN.field:
				return text(field, person.bankAccount.iban);
			case headers.SWIFT.field:
				return text(field, person.bankAccount.swift);
			case headers.ARCHIVED_DATE.field: {
				const archivedDate = this.getArchivedDate(person);
				return text(
					field,
					!!archivedDate && archivedDate.isValid()
						? this.formatDateUserSettingPipe.transform(archivedDate.toDate())
						: person.archivedDate,
					person.archivedDate
				);
			}
			// return text(field, this.d(player.archivedDate, 'dd/MM/yy'), this.d(player.archivedDate, 'yyyy/MM/dd'));
			case headers.ARCHIVED_MOTIVATION.field:
				return {
					field,
					type: 'text',
					value: this.getPlayerArchivedMotivation(person)
				};
			case headers.ARCHIVE.field:
				return {
					field,
					type: 'archive',
					value: null,
					class: 'tw-text-center'
				};
			case headers.DELETE.field:
				return {
					field,
					type: 'delete',
					value: null,
					class: 'tw-text-center'
				};
			// SALARY
			case headers.FIXED_WAGE.field: {
				// TODO matteo per staff?
				return this.getCurrencyValue(person.fixedWage, field);
			}
			case headers.BONUS_TOT.field: {
				return this.getCurrencyValue(person.totalBonus, field);
			}
			case headers.APP_FEES.field: {
				return this.getCurrencyValue(person.appearanceFee, field);
			}
			case headers.APP_BONUS.field: {
				return this.getCurrencyValue(person.appearanceBonus, field);
			}
			case headers.PERF_FEES.field: {
				return this.getCurrencyValue(person.performanceFee, field);
			}
			case headers.PERF_BONUS.field: {
				return this.getCurrencyValue(person.performanceBonus, field);
			}
			case headers.TEAM_BONUS.field: {
				return this.getCurrencyValue(person.teamBonus, field);
			}
			case headers.SIGNING_BONUS.field: {
				return this.getCurrencyValue(person.signingBonus, field);
			}
			case headers.CUSTOM_BONUS.field: {
				return this.getCurrencyValue(person.customBonus, field);
			}
			case headers.CONTRIBUTIONS.field: {
				return this.getCurrencyValue(person.contributions, field);
			}
			// ASSET
			case headers.ASSET_VALUE.field: {
				return this.getCurrencyValue(person.assetValue, field);
			}
			case headers.TRANSFER_FEE.field: {
				return this.getCurrencyValue(person.transferFee, field);
			}
			case headers.AGENT_FEE.field: {
				return this.getCurrencyValue(person.agentFee, field);
			}
			case headers.AGENT_FEE_PERC.field: {
				return text(field, person.agentFeePerc ? `${person.agentFeePerc}%` : ``, person.agentFeePerc);
			}
			case headers.AMORTIZATION.field: {
				return this.getCurrencyValue(person.amortizationAsset, field);
			}
			case headers.NET_BOOK_VALUE.field: {
				return this.getCurrencyValue(person.netBookValue, field);
			}
			case headers.MARKET_VALUE.field: {
				return this.getCurrencyValue(person.marketValue, field);
			}
			case headers.GAIN_LOSS.field: {
				return this.getCurrencyValue(person.gainLoss, field);
			}
			case headers.GAIN_LOSS_PERC.field: {
				return text(field, person.gainLossPercent ? `${person.gainLossPercent}%` : ``, person.gainLossPercent);
			}
			case headers.AMORTIZATION_SEASON.field: {
				return this.getCurrencyValue(person.seasonAmortization, field);
			}
			default:
				return {
					field,
					type: 'text',
					value: 'TODO'
				};
		}
	}

	private getCurrencyValue(value: any, field: string) {
		const result =
			(value || value === 0) && !isNaN(value)
				? `${this.currentTeamService.getCurrency()}${value === 0 ? 0 : this.millionsPipe.transform(value, true)}`
				: ``;
		return text(field, result, !isNaN(value) ? value : 0);
	}

	private formatMembership(value: any, field: string): PlayerTableCell {
		return !value
			? { field, type: 'text', value: '' }
			: text(
					field,
					moment(value, getMomentFormatFromStorage()).isValid()
						? this.formatDateUserSettingPipe.transform(moment(value, getMomentFormatFromStorage()).toDate())
						: value,
					value
			  );
	}

	private formatDocumentExpiryDates(documents: any[] = [], documentStatus: string, field: string): PlayerTableCell {
		return {
			field,
			type: 'expiry',
			value: documentStatus
				? this.formatDateUserSettingPipe.transform(
						moment(new Date(documentStatus), getMomentFormatFromStorage()).toDate()
				  )
				: '',
			class: 'tw-text-center',
			raw: documents
				.filter(({ expiryDate }) => !!expiryDate)
				.sort((doc1, doc2) => (moment(doc1.expiryDate).isBefore(moment(doc2.expiryDate)) ? -1 : 1))
				.map(
					doc => this.translate.instant(doc.type) + ': ' + moment(doc.expiryDate).format(getMomentFormatFromStorage())
				)
				.join(' - ')
		};
	}

	private formatNextMedicalScreeningExpiryDates(
		medicalRecord: Pick<Anamnesys, 'id' | 'expirationDate'>,
		field: string
	): PlayerTableCell {
		return {
			field,
			type: 'medicalRecord',
			value: medicalRecord
				? this.formatDateUserSettingPipe.transform(
						moment(new Date(medicalRecord.expirationDate), getMomentFormatFromStorage()).toDate()
				  )
				: '',
			class: 'tw-text-center',
			raw: moment(medicalRecord.expirationDate).format(getMomentFormatFromStorage())
		};
	}

	private formatContractTypeNotarization(notarized: boolean | 'none', field: string): PlayerTableCell {
		return {
			field,
			type: 'notarization',
			value:
				notarized === 'none'
					? null
					: notarized
					? this.translate.instant('admin.contracts.validated')
					: `${this.t('NOT')} ${this.t('admin.contracts.validated')}`,
			class: 'tw-text-center',
			raw: notarized
		};
	}

	private t(key: string, interpolateParams?: any): string {
		if (!key) return '';
		return this.translate.instant(key, interpolateParams);
	}

	private d(date: Date, format: string): string {
		if (!date) return '';
		return this.datePipe.transform(date, format);
	}

	private getPlayerContractDate(player: any, from: boolean, format = 'dd/MM/yy') {
		const dateRaw = from ? player.contractFrom : player.contractExpiry;
		if (!dateRaw) return '';
		const date = moment(dateRaw);
		return date.isValid() ? this.d(date.toDate(), format) : '';
	}

	private getPlayerArchivedMotivation(player) {
		return !!player.archivedMotivation && player.archivedMotivation.length > 0 ? this.t(player.archivedMotivation) : '';
	}


	private getArchivedDate(player) {
		return player.archivedDate ? moment(player.archivedDate, `${getMomentFormatFromStorage()} hh:mm`) : undefined;
	}
}
