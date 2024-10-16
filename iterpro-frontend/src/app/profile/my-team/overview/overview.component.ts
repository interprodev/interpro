import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AzureStorageApi, LoopBackConfig, Player } from '@iterpro/shared/data-access/sdk';
import {
	ConstantService,
	ErrorService,
	SportType,
	TINY_EDITOR_OPTIONS,
	getDateFormatConfig,
	getFormatFromStorage,
	getLimb,
	getMomentFormatFromStorage,
	getPositions,
	playerRolesByPosition,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';

const url: string = LoopBackConfig.getPath() + '/' + LoopBackConfig.getApiVersion() + '/prova/files/upload';

@UntilDestroy()
@Component({
	selector: 'iterpro-overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit, OnChanges {
	@Input() player: Player;
	@Input() editMode: boolean;
	@Input() sportType: SportType;

	movOnBall: any[] = [];
	movOffBall: any[] = [];
	passing: any[] = [];
	finishing: any[] = [];
	defending: any[] = [];
	technique: any[] = [];
	roles1: any[] = [];
	roles2: any[] = [];
	roles3: any[] = [];
	nationalities: SelectItem[] = [];
	preferredFoot: SelectItem[] = [];
	positions1: SelectItem[] = [];
	positions2: SelectItem[] = [];
	positions3: SelectItem[] = [];
	position: string;
	foot: string;
	nationality: string;
	birthDate: string;
	contrStart: string;
	contrEnd: string;
	uploadUrl: string;
	downloadUrl: string;
	cropping = false;
	imageBase64: any = '';
	croppedImage: any = '';
	tmpCroppedImage: any = '';
	successCroppedImage: any = null;
	hoverPosition = '';
	positionLegendItems: { label: string; tooltip: string }[];
	preferredLegendItems: { label: string; tooltip: string }[];
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	dateFormat: string;
	dateMask: string;
	constructor(
		private constantService: ConstantService,
		private translate: TranslateService,
		private azureStorageApi: AzureStorageApi,
		private sanitizer: DomSanitizer,
		private errorService: ErrorService
	) {
		this.onUpload = this.onUpload.bind(this);
		const { primengConfig, primengInputMask } = getDateFormatConfig(getFormatFromStorage());
		this.dateFormat = String(primengConfig.dateFormat);
		this.dateMask = primengInputMask;
	}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(() => this.getSelectItems());
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player'] && this.player) {
			this.init();
		}
	}

	hover(position) {
		this.hoverPosition = position.value;
	}

	private init() {
		this.birthDate = moment(this.player.birthDate).format(this.dateFormat.toUpperCase());
		this.contrStart = moment(this.player.contractStart).format(getMomentFormatFromStorage());
		this.contrEnd = moment(this.player.contractEnd).format(getMomentFormatFromStorage());
		if (this.player.position)
			this.roles1 = (playerRolesByPosition[this.player.position] || []).map(({ label, value, tooltip }) => ({
				label: this.translate.instant(label),
				value,
				tooltip: this.translate.instant(tooltip)
			}));
		if (this.player.position2)
			this.roles2 = (playerRolesByPosition[this.player.position2] || []).map(({ label, value, tooltip }) => ({
				label: this.translate.instant(label),
				value,
				tooltip: this.translate.instant(tooltip)
			}));
		if (this.player.position3)
			this.roles3 = (playerRolesByPosition[this.player.position3] || []).map(({ label, value, tooltip }) => ({
				label: this.translate.instant(label),
				value,
				tooltip: this.translate.instant(tooltip)
			}));
		if (!this.player.role1) this.player.role1 = [];
		if (!this.player.role3) this.player.role2 = [];
		if (!this.player.role2) this.player.role3 = [];

		this.positions1 = getPositions(this.sportType).map(({ label, value }) => ({
			label: this.translate.instant(label),
			value
		}));

		this.positions2 = this.positions1.filter(({ value }) => value !== this.player.position);
		this.positions3 = this.positions2.filter(({ value }) => value !== this.player.position2);
	}

	private getSelectItems() {
		this.positionLegendItems = this.constantService.getPositionLegendItems();
		this.preferredLegendItems = this.constantService.getPreferredLegendItems();
		this.movOnBall = playerRolesByPosition['movOnBall'].map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.movOffBall = playerRolesByPosition['movOffBall'].map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.passing = playerRolesByPosition['passing'].map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.finishing = playerRolesByPosition['finishing'].map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.defending = playerRolesByPosition['defending'].map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.technique = playerRolesByPosition['technique'].map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.preferredFoot = this.constantService.getFeets().map(({ label, value }) => ({
			label: this.translate.instant(label),
			value
		}));
		this.nationalities = this.constantService.getNationalities().map(({ label, value }) => ({
			label: this.translate.instant(label),
			value
		}));
	}

	onUpload(urlUpload, publicId, originalFilename) {
		this.updatePlayerPhoto(urlUpload, publicId, originalFilename);
	}

	updatePlayerPhoto(photoUrl, photoPublicId, originalFilename) {
		this.player.profilePhotoUrl = photoPublicId;
		this.player.downloadUrl = photoUrl;
		this.player.profilePhotoName = originalFilename;
	}

	updatePlayer() {
		this.player.birthDate = moment(this.birthDate, getMomentFormatFromStorage()).startOf('day').toDate();
		this.player.contractStart = moment(this.contrStart, getMomentFormatFromStorage()).startOf('day').toDate();
		this.player.contractEnd = moment(this.contrEnd, getMomentFormatFromStorage()).startOf('day').toDate();
	}

	changeBackground() {
		return this.sanitizer.bypassSecurityTrustStyle(
			`url("${encodeURI(this.player.downloadUrl)}"), url("${encodeURI('../../../../assets/img/default_icon.png')}")`
		);
	}

	deleteImage() {
		this.azureStorageApi
			.removeFile(this.player.clubId, this.player.profilePhotoUrl)
			.pipe(untilDestroyed(this))
			.subscribe(
				() => {
					this.player.profilePhotoName = null;
					this.player.profilePhotoUrl = null;
					this.player.downloadUrl = null;
				},
				(error: Error) => this.errorService.handleError(error)
			);
	}

	onSelectPosition1({ value }: SelectItem) {
		this.player.role1 = [];
		this.roles1 = (playerRolesByPosition[value] || []).map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.roles1 = sortByName(this.roles1, 'label');
		this.positions2 = this.positions1.filter(({ value }) => value !== this.player.position);
		if (this.player.position3) this.positions3 = this.positions2;
	}

	onSelectPosition2({ value }: SelectItem) {
		this.player.role2 = [];
		this.roles2 = (playerRolesByPosition[value] || []).map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.roles2 = sortByName(this.roles2, 'label');
		this.positions3 = this.positions2.filter(({ value }) => value !== this.player.position2);
	}

	onSelectPosition3({ value }: SelectItem) {
		this.player.role3 = [];
		this.roles3 = (playerRolesByPosition[value] || []).map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.roles3 = sortByName(this.roles3, 'label');
	}

	getLimb() {
		return getLimb(this.sportType);
	}
}
