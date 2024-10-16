import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
	Attachment,
	AzureStorageApi,
	Club,
	Customer,
	LoopBackAuth,
	Player,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	AzureStorageService,
	ConstantService,
	ErrorService,
	PeopleDocumentType,
	PermissionConstantService,
	SportType,
	getDateFormatConfig,
	getFormatFromStorage,
	getLimb,
	getMomentFormatFromStorage,
	getPositions,
	isNotEmpty,
	sortByDateDesc,
	sortByName,
	getTeamSettings,
	userHasPermission
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { EMPTY, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { getReport } from './report';
import { CloudUploadResult } from '@iterpro/shared/feature-components';

export class FederalMembership {
	id: string;
	number: string;
	issueDate: Date;
	expiryDate: Date;
	filingDate: Date;
	type: string;
	status: string;
	from: string;
	details: string;
	_attachments: Attachment[];

	constructor() {
		this.id = uuid();
		this._attachments = [];
	}
}

export class SportPassport {
	id: string;
	season: string;
	dateFrom: Date;
	dateTo: Date;
	age: string;
	club: string;
	category: string;
	nation: string;
	status: string;
	basis: string;
	notes: string;
	_attachments: Attachment[];

	constructor() {
		this.id = uuid();
		this._attachments = [];
	}
}

export class CoachingBadge {
	id: string;
	number: string;
	issueDate: Date;
	expiryDate: Date;
	type: string;

	constructor() {
		this.id = uuid();
	}
}

export class Document {
	id: string;
	type: string;
	url: string;
	imageUrl: string;
	publicId: string;
	fileName: string;
	number: string;
	issuedBy: string;
	issuedDate: Date;
	expiryDate: Date;

	constructor() {
		this.id = uuid();
	}
}

export class BankAccount {
	currency: string;
	bank: string;
	routingNumber: string;
	accountNumber: string;
	swift: string;
	iban: string;
}

export class Address {
	street: string;
	city: string;
	zipCode: string;
	state: string;
	nation: string;
}

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person-details',
	templateUrl: './squads-person-details.component.html',
	styleUrls: ['./squads-person-details.component.css']
})
export class SquadsPersonDetailsComponent implements OnInit, OnChanges {
	@Input() person: any;
	@Input() playerMode = true;
	@Input() agentMode = false;
	@Input() editMode: boolean;
	@Input() transfer = false;
	@Input() club: Club;
	@Input() seasons: TeamSeason[] = [];
	@Input() customers: Customer[] = [];

	@Output() reportsData = new EventEmitter<string>();
	@Output() removeFromSeasonEmitter: EventEmitter<object> = new EventEmitter<object>();
	educations: any[];
	nationalityOrigins: any[];
	birthDate: any;
	genders: any[];
	nationalities: any[];
	altNationalities: any[];
	ageGroups: any[];

	school = false;
	federalTypeOptions = [
		{ label: 'LNPA', value: 'LNPA' },
		{ label: 'LNPB', value: 'LNPB' },
		{ label: 'LND', value: 'LND' },
		{ label: 'SGS', value: 'SGS' }
	];
	federalTypeStatus = [
		{ label: 'UEPro', value: '01' },
		{ label: 'amateurExProfessional', value: '02' },
		{ label: 'amateur', value: '03' },
		{ label: 'young>14', value: '04' },
		{ label: 'disqualified', value: '05' },
		{ label: 'expelled', value: '06' },
		{ label: 'extraUEAmateur', value: '07' },
		{ label: 'professionalEco', value: '09' },
		{ label: 'freeTransfer', value: '10' },
		{ label: 'extraUEPro', value: '11' },
		{ label: 'extraUEProNoAbroad', value: '12' },
		{ label: 'UEProNoAbroad', value: '13' },
		{ label: 'youngUE', value: '14' },
		{ label: 'UEAmateur', value: '20' },
		{ label: 'youngextraUE', value: '24' },
		{ label: 'youngExtraUENoAbroad', value: '34' },
		{ label: 'youngUENoAbroad', value: '35' },
		{ label: 'sgsExtraUEAbroadFed', value: '60' },
		{ label: 'sgsUEAbroadFed', value: '61' },
		{ label: 'youngSchool', value: '66' },
		{ label: 'sgsUEForeign', value: '67' },
		{ label: 'sgsExtraUEForeign', value: '68' },
		{ label: 'UEAmateurNoAbroad', value: '70' },
		{ label: 'ExtraUEAmateurNoAbroad', value: '71' },
		{ label: 'ForeignAmateurVincPlurien', value: '80' }
	];
	details = [
		{ label: 'firstMembershipPro', value: 'firstMembershipPro' },
		{ label: 'firstMembershipTeam', value: 'firstMembershipTeam' },
		{ label: 'membershipTeam', value: 'membershipTeam' }
	];
	sportPassportStatus = [
		{ label: 'sportPassport.status.professioal', value: 'professional' },
		{ label: 'sportPassport.status.amateur', value: 'amateur' },
		{ label: 'sportPassport.status.youngAmateur', value: 'youngAmateur' },
		{ label: 'sportPassport.status.unknown', value: 'unknown' },
		{ label: 'sportPassport.status.none', value: '-' }
	];
	sportPassportBasis = [
		{ label: 'sportPassport.basis.permanent', value: 'permanent' },
		{ label: 'sportPassport.basis.released', value: 'released' },
		{ label: 'sportPassport.basis.releasedItc', value: 'releasedItc' },
		{ label: 'sportPassport.basis.loan', value: 'loan' },
		{ label: 'sportPassport.basis.-', value: '-' }
	];
	maritalStatus = [
		{ label: 'marital.status.free', value: 'free' },
		{ label: 'marital.status.married', value: 'married' }
	];

	documentTypeOptions: PeopleDocumentType[] = [];
	expiration: Date;
	issued: any;
	positions1: SelectItem[] = [];
	positions2: SelectItem[] = [];
	positions3: SelectItem[] = [];
	visible: boolean;
	dialogType: any;
	dialogModel: any;
	altPassport: any[];
	positions: any;
	teams: SelectItem[] = [];
	changeTeamDialog = false;
	newTeamId: string = null;
	oldTeamId: string = null;
	customersItems: SelectItem[] = [];
	sportType: SportType;
	dateFormat: string;
	dateMask: string;
	medicalRecordsLink: unknown;
	hasPermissionForMedical!: boolean;

	constructor(
		private constantService: ConstantService,
		private translate: TranslateService,
		private error: ErrorService,
		private azureStorageApi: AzureStorageApi,
		private azurePipe: AzureStoragePipe,
		private permissionsService: PermissionConstantService,
		private azureStorageService: AzureStorageService,
		private authService: LoopBackAuth
	) {
		const { primengConfig, primengInputMask } = getDateFormatConfig(getFormatFromStorage());
		this.dateFormat = String(primengConfig.dateFormat);
		this.dateMask = primengInputMask;
		this.onUploadImagePic = this.onUploadImagePic.bind(this);
		this.onUploadDocument = this.onUploadDocument.bind(this);
		this.hasPermissionForMedical = this.getHasPermissionForMedical();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['person'] && this.person) {
			this.init();
		}
	}

	ngOnInit() {
		this.sportType = this.club.sportType as SportType;
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this.nationalities = this.constantService.getNationalities().map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.altNationalities = this.nationalities.filter(x => x.value !== this.person.nationality);
				this.altPassport = this.nationalities.filter(x => x.value !== this.person.passport);
				this.genders = this.constantService.getGenders().map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.educations = this.constantService.getEducations().map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.nationalityOrigins = this.constantService.getNationalityOrigins().map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.ageGroups = this.constantService.getAgeGroups().map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.federalTypeOptions = this.federalTypeOptions.map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.federalTypeStatus = this.federalTypeStatus.map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.sportPassportStatus = this.sportPassportStatus.map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.sportPassportBasis = this.sportPassportBasis.map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.details = this.details.map(x => ({
					label: this.translate.instant(x.label, { value: this.club.name }),
					value: x.value
				}));
				this.maritalStatus = this.maritalStatus.map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.teams = this.club.teams.map(x => ({ label: x.name, value: x.id }));
				this.customersItems = sortByName(
					(this.customers || []).map(x => ({ label: `${x.firstName} ${x.lastName}`, value: x.id })),
					'label'
				);
				this.positions1 = getPositions(this.sportType).map(x => ({
					label: this.translate.instant(x.label),
					value: x.value
				}));
				this.positions2 = this.positions1.filter(x => x.value !== this.person.position);
				this.positions3 = this.positions2.filter(x => x.value !== this.person.position2);
				this.medicalRecordsLink = this.getMedicalRecordsLink(this.person);
			});
	}

	private loadDocumentOptions() {
		const basicDocuments = this.constantService.getDocumentType().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value,
			isCustom: x.isCustom
		}));
		const basicDocumentsValues = basicDocuments.map(({ value }) => value);
		const customDocuments = (this.person?.documents || [])
			.filter(({ type }) => !basicDocumentsValues.includes(type))
			.map(({ type }) => ({
				label: type,
				value: type,
				isCustom: false
			}));
		this.documentTypeOptions = [...basicDocuments, ...customDocuments];
	}

	private init() {
		this.loadDocumentOptions();
		this.computeAgeForAllSP();
		this.birthDate = moment(this.person.birthDate).format(getMomentFormatFromStorage());
		this.school = this.person.school ? true : false;
		if (!this.playerMode) {
			if (!this.person.federalMembership) {
				this.person.federalMembership = [];
			} else if (this.person.federalMembership && !Array.isArray(this.person.federalMembership)) {
				this.person.federalMembership = [new FederalMembership()];
			} else {
				this.person.federalMembership.forEach((x: FederalMembership) => {
					if (x.issueDate) x.issueDate = new Date(x.issueDate);
					if (x.expiryDate) x.expiryDate = new Date(x.expiryDate);
					if (x.filingDate) x.filingDate = new Date(x.filingDate);
					if (!x._attachments) x._attachments = [];
				});
				this.person.federalMembership = sortByDateDesc(this.person.federalMembership, 'issueDate');
			}
			if (!this.person.sportPassport) {
				this.person.sportPassport = [];
			} else if (this.person.sportPassport && !Array.isArray(this.person.sportPassport)) {
				this.person.sportPassport = [new SportPassport()];
			} else {
				this.person.sportPassport.forEach((x: SportPassport) => {
					if (x.dateFrom) x.dateFrom = new Date(x.dateFrom);
					if (x.dateTo) x.dateTo = new Date(x.dateTo);
					if (!x._attachments) x._attachments = [];
				});
				this.person.sportPassport = sortByDateDesc(this.person.sportPassport, 'date');
			}

			if (!this.agentMode) {
				if (!this.person.coachingBadges) {
					this.person.coachingBadges = [];
				} else if (!Array.isArray(this.person.coachingBadges)) {
					this.person.coachingBadges = [new CoachingBadge()];
				} else {
					this.person.coachingBadges.forEach((coachingBadge: CoachingBadge) => {
						if (coachingBadge.issueDate) coachingBadge.issueDate = new Date(coachingBadge.issueDate);
						if (coachingBadge.expiryDate) coachingBadge.expiryDate = new Date(coachingBadge.expiryDate);
					});
					this.person.coachingBadges = sortByDateDesc(this.person.coachingBadges, 'issueDate');
				}
			}
		}

		if (!this.person.otherMobile) this.person.otherMobile = [];

		if (this.playerMode) {
			const orderedAn = isNotEmpty(this.person.anamnesys)
				? sortByDateDesc(this.person.anamnesys, 'expirationDate')
				: [];
			if (orderedAn && orderedAn.length > 0) {
				this.expiration = orderedAn[0].expirationDate;
				this.issued = orderedAn[0].date;
			}
		}

		if (!this.person.bankAccount) this.person.bankAccount = new BankAccount();
		this.positions = sortByName(
			this.permissionsService.getPositions().map(x => ({ label: this.translate.instant(x), value: x })),
			'label'
		);

		if (!this.person.address) this.person.address = new Address();
		if (!this.person.domicile) this.person.domicile = new Address();

		this.oldTeamId = this.person.teamId;
	}

	getReportData() {
		return getReport(this, this.azurePipe);
	}

	getReport() {
		this.reportsData.next('');
	}

	addFederalMembership() {
		const fedM = new FederalMembership();
		fedM._attachments = [];
		this.person.federalMembership = !this.person.federalMembership ? [fedM] : [...this.person.federalMembership, fedM];
	}

	addSportPassport() {
		const sportP = new SportPassport();
		sportP._attachments = [];
		this.person.sportPassport = !this.person.sportPassport ? [sportP] : [...this.person.sportPassport, sportP];
	}

	addCoachingBadge() {
		const coachingBadge = new CoachingBadge();
		this.person.coachingBadges = !this.person.coachingBadges
			? [coachingBadge]
			: [...this.person.coachingBadges, coachingBadge];
	}

	onUploadImagePic({ downloadUrl, profilePhotoUrl, profilePhotoName }: CloudUploadResult) {
		this.updatePhoto(downloadUrl, profilePhotoUrl, profilePhotoName);
	}

	updatePhoto(photoUrl, photoPublicId, originalFilename) {
		this.person.profilePhotoUrl = photoPublicId;
		this.person.downloadUrl = photoUrl;
		this.person.profilePhotoName = originalFilename;
	}

	updateAge() {
		this.person.birthDate = moment(this.birthDate, getMomentFormatFromStorage()).startOf('day').toDate();
		this.computeAgeForAllSP();
	}

	onSelectNationality(event) {
		this.altNationalities = this.nationalities.filter(x => x.value !== this.person.nationality);
	}

	onSelectPassport(event) {
		this.altPassport = this.nationalities.filter(x => x.value !== this.person.passport);
	}

	getFacebook(person) {
		return person.facebook
			? 'https://www.facebook.com/' + person.facebook.replace('https://www.facebook.com/', '')
			: 'https://www.facebook.com/';
	}

	getInstagram(person) {
		return person.instagram
			? 'https://www.instagram.com/' + person.instagram.replace('https://www.instagram.com/', '')
			: 'https://www.instagram.com/';
	}

	getTwitter(person) {
		return person.twitter
			? 'https://www.twitter.com/' + person.twitter.replace('https://www.twitter.com/', '')
			: 'https://www.twitter.com/';
	}

	getLinkedin(person) {
		return person.linkedin
			? 'https://www.linkedin.com/in/' + person.linkedin.replace('https://www.linkedin.com/in/', '')
			: 'https://www.linkedin.com/in/';
	}

	deleteImage() {
		this.azureStorageApi
			.removeFile(this.person.clubId, this.person.profilePhotoUrl)
			.pipe(first(), untilDestroyed(this))
			.subscribe(
				(res: any) => {
					this.person.profilePhotoName = null;
					this.person.profilePhotoUrl = null;
					this.person.downloadUrl = null;
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	onUploadDocument(i, url, publicId, originalFilename) {
		this.person.documents[i].imageUrl = url;
		this.person.documents[i].publicId = publicId;
		this.person.documents[i].filename = originalFilename;
	}

	deleteDocument(index) {
		this.azureStorageApi
			.removeFile(this.person.clubId, this.person.documents[index].publicId)
			.pipe(first(), untilDestroyed(this))
			.subscribe(
				(res: any) => {
					this.person.documents[index].filename = null;
					this.person.documents[index].publicId = null;
					this.person.documents[index].imageUrl = null;
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	getExpirationTitle(person) {
		const orderedAn = isNotEmpty(person.anamnesys) ? sortByDateDesc(person.anamnesys, 'expirationDate') : [];
		if (orderedAn && orderedAn.length > 0) {
			const expDate = orderedAn[0].expirationDate;
			const preKey = this.translate.instant('medical.prevention.expiration');
			const stringDate = moment(expDate).format(getMomentFormatFromStorage());
			return preKey + stringDate;
		}
		return '';
	}

	addOtherMobile() {
		if (this.editMode) {
			this.person.otherMobile = [
				...this.person.otherMobile,
				{
					name: null,
					mobile: null
				}
			];
		}
	}

	removeContact(i) {
		this.person.otherMobile.splice(i, 1);
	}

	copyAddressToDomicile(event) {
		if (event === true) this.person.domicile = this.person.address;
		else
			this.person.domicile = {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			};
	}

	addDocument() {
		this.person.documents = !this.person.documents ? [new Document()] : [...this.person.documents, new Document()];
	}

	removeDocument(i) {
		this.person.documents.splice(i, 1);
	}

	onUpload(event: CloudUploadResult, i: number) {
		return this.onUploadDocument(i, event.downloadUrl, event.profilePhotoUrl, event.profilePhotoName);
	}

	onSelectPosition1(e) {
		this.positions2 = this.positions1.filter(x => x.value !== this.person.position);
		if (this.person.position3) this.positions3 = this.positions2;
	}

	onSelectPosition2(e) {
		this.positions3 = this.positions2.filter(x => x.value !== this.person.position2);
	}

	// methods for the multi-file uploader dialog
	openFileDialog(type, index) {
		this.visible = true;
		this.dialogType = this.person[type][index];
	}

	onSaveAttachments(event: Attachment[]) {
		this.visible = false;
		this.dialogType._attachments = event;
		this.dialogType = null;
	}

	onDiscardAttachments() {
		this.visible = false;
	}

	computeAge(event, i) {
		this.person.sportPassport[i].age = moment(event).diff(this.person.birthDate, 'years');
	}

	private computeAgeForAllSP() {
		if (this.person.sportPassport)
			this.person.sportPassport.forEach((x, i) => this.computeAge(this.person.sportPassport[i].dateFrom, i));
	}

	checkPresenceInCurrentSeason(event) {
		this.newTeamId = event.value;
		const current = this.seasons.find(x => moment().isBetween(moment(x.offseason), moment(x.inseasonEnd), 'day', '[]'));
		if (current && current.playerIds.includes(this.person.id)) {
			this.changeTeamDialog = true;
		}
	}

	closeTeamDialog(flag: boolean) {
		this.removeFromSeasonEmitter.emit({ flag, newTeamId: this.newTeamId, oldTeamId: this.oldTeamId });
		this.changeTeamDialog = false;
	}

	deleteRow(type: string, index: number) {
		let obs = [EMPTY];
		if (this.person[type][index]._attachments.length > 0) {
			obs = this.person[type][index]._attachments.map(({ url }) => this.azureStorageApi.removeFile(this.club.id, url));
			forkJoin(obs)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: () => this.person[type].splice(index, 1),
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.person[type].splice(index, 1);
		}
	}

	deleteCoachingBadgeRow(index: number) {
		this.person.coachingBadges.splice(index, 1);
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}

	private getHasPermissionForMedical(): boolean {
		const customer = this.authService.getCurrentUserData();
		const teamSettings = getTeamSettings(customer.teamSettings, customer.currentTeamId);
		return userHasPermission(teamSettings, 'medical') && userHasPermission(teamSettings, 'maintenance');
	}

	private getMedicalRecordsLink({ anamnesys, id: playerId }: Player): unknown {
		// const sorted = sortByDateDesc(anamnesys || [], 'expirationDate');
		return [
			'/medical/maintenance',
			{
				id: playerId,
				tabIndex: 4
			}
		];
	}

	getLimb() {
		return getLimb(this.sportType);
	}

	isCustomDocumentType(documentType: string): boolean {
		const isNotPresentOnDefault = !this.documentTypeOptions.find(
			({ value, isCustom }) => !isCustom && value === documentType
		);
		return documentType && isNotPresentOnDefault;
	}
}
