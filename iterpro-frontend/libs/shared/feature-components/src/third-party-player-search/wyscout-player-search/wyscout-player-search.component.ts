import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	AlreadyImportedPlayer,
	TableColumnBase,
	WyscoutApi,
	WyscoutPlayerSearchResult,
	WyscoutPlayerSearchResultAdditionalInfo
} from '@iterpro/shared/data-access/sdk';
import { PlayerFlagComponent } from '@iterpro/shared/ui/components';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	BlockUiInterceptorService,
	ConstantService,
	ErrorService,
	ExchangeService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { MomentModule } from 'ngx-moment';
import { SelectItem } from 'primeng/api';
import { first } from 'rxjs/operators';
import { WyscoutPlayerAdditionalInfoComponent } from '../wyscout-additional-info/wyscout-player-additional-info';
import { assign } from 'lodash';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		TranslateModule,
		PrimeNgModule,
		PlayerFlagComponent,
		ShortNumberPipe,
		MomentModule,
		WyscoutPlayerAdditionalInfoComponent,
		BlockUIModule
	],
	selector: 'iterpro-wyscout-player-search',
	templateUrl: './wyscout-player-search.component.html',
	styleUrls: ['./wyscout-player-search.component.css'],
	providers: [ShortNumberPipe]
})
export class WyscoutPlayerSearchComponent implements OnInit {
	@ViewChild('table', { static: false }) table: any;
	@Input() visible!: boolean;
	@Input() selection: 'single' | 'multiple' = 'multiple';
	@Input() alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	@Output() selectPlayersEmitter: EventEmitter<WyscoutPlayerSearchResult[]> = new EventEmitter<
		WyscoutPlayerSearchResult[]
	>();
	@Output() discardEmitter: EventEmitter<any> = new EventEmitter<any>();
	@BlockUI('wysearch') blockUI!: NgBlockUI;
	dialogVisible!: boolean;

	selectedPlayers: WyscoutPlayerSearchResult[] = [];
	name!: string;
	results!: WyscoutPlayerSearchResult[];
	cols: TableColumnBase[] = [];
	competitions!: SelectItem[];
	positions!: SelectItem[];
	nationalities!: SelectItem[];
	nationality: string[] = [];
	position: string[] = [];
	competition: any[] = [];
	ageValues: number[] = [15, 38];
	transferValues: number[] = [0, 10];
	today!: Date;
	currency!: string;
	currencyCode!: string;
	rate!: number;

	constructor(
		private wyscout: WyscoutApi,
		private error: ErrorService,
		private translate: TranslateService,
		private constants: ConstantService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private currentTeamService: CurrentTeamService,
		private exchangeService: ExchangeService
	) {}

	ngOnInit() {
		this.today = moment().toDate();
		this.currency = this.currentTeamService.getCurrency();
		this.currencyCode = this.currentTeamService.getCurrencyCode();
		this.cols = [
			{
				field: 'shortName',
				header: this.translate.instant('name'),
				sortable: true
			},
			{
				field: 'passportArea.alpha2code',
				header: this.translate.instant('profile.overview.nationality'),
				sortable: true
			},
			{
				field: 'birthDate',
				header: this.translate.instant('profile.overview.age'),
				sortable: true
			},
			{
				field: 'role.code2',
				header: this.translate.instant('profile.position'),
				sortable: true
			},
			{
				field: 'currentTeam.name',
				header: this.translate.instant('admin.evaluation.club'),
				sortable: true
			},
			{
				field: 'transferValue',
				header: `${this.translate.instant('profile.overview.transferValue')} (${this.currency})`,
				sortable: true
			},
			{
				field: 'alreadyImportedTeam',
				header: `Scouting Team`,
				sortable: true
			}
		];
		if (this.currencyCode !== 'EUR') this.getExchangeRates(this.currencyCode);
		this.blockUiInterceptorService
			.disableOnce(this.wyscout.playerSearchFilters())
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ({ competitions, positions }: any) => {
					this.competitions = competitions.map(({ name, area, wyId }) => ({
						name: name + ' (' + area.alpha2code + ')',
						wyId
					}));
					this.positions = positions.map((value: string) => ({
						label: this.translate.instant(value),
						value
					}));
					this.nationalities = this.constants.getNationalities().map(({ label, value }) => ({
						label: this.translate.instant(label),
						value
					}));
				},
				error: (error: Error) => this.error.handleError(error)
			});
		setTimeout(() => {
			this.dialogVisible = true;
		}, 500);
	}

	private getExchangeRates(code: string) {
		this.exchangeService
			.exchange(code)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: any) => {
					this.rate = res.rates[code];
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	discard() {
		this.discardEmitter.emit();
	}

	save() {
		if (this.rate && this.selection !== 'single') {
			this.selectedPlayers.forEach(player => {
				player.transferValue = player.transferValue * this.rate;
			});
		}
		this.selectPlayersEmitter.emit(this.selectedPlayers);
	}

	searchByName(playerName: string) {
		this.blockUI.start();
		this.blockUiInterceptorService
			.disableOnce(
				this.wyscout.searchPlayers(
					playerName,
					null,
					null,
					null,
					null,
					null,
					this.currentTeamService.getCurrentTeam().gender
				)
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (players: WyscoutPlayerSearchResult[]) => {
					this.blockUI.stop();
					this.results = players;
					this.results.forEach(player => {
						const alreadyImportedPlayer = this.alreadyImportedPlayers.find(
							({ providerId }) => providerId === player.wyId
						);
						if (alreadyImportedPlayer) {
							player.alreadyImported = true;
							player.alreadyImportedTeam = alreadyImportedPlayer?.teamName;
						}
					});
					if (this.table) this.table.reset();
					this.getAdditionalInfo(this.results.map(({ wyId }) => wyId));
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	searchByFilter() {
		this.blockUI.start();
		this.blockUiInterceptorService
			.disableOnce(
				this.wyscout.searchPlayers(
					null,
					this.competition.map(({ wyId }) => wyId),
					this.nationality,
					this.ageValues[0],
					this.ageValues[1],
					this.position,
					this.currentTeamService.getCurrentTeam().gender
				)
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (players: WyscoutPlayerSearchResult[]) => {
					this.blockUI.stop();
					this.results = players;
					this.results.forEach(player => {
						const alreadyImportedPlayer = this.alreadyImportedPlayers.find(
							({ providerId }) => providerId === player.wyId
						);
						if (alreadyImportedPlayer) {
							player.alreadyImported = true;
							player.alreadyImportedTeam = alreadyImportedPlayer?.teamName;
						}
					});
					this.getAdditionalInfo(this.results.map(({ wyId }) => wyId));
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getAdditionalInfo(wyscoutIds: number[]) {
		this.wyscout
			.playerSearchAdditionalInfo(wyscoutIds)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: { players: WyscoutPlayerSearchResultAdditionalInfo[] }) => {
					const getInfo = wyId => {
						const playerAdditionalInfo = res.players.find(({ wyscoutId }) => wyscoutId === wyId);
						if (playerAdditionalInfo)
							return assign(playerAdditionalInfo, {
								hasAdditionalInfo: true
							});
						return playerAdditionalInfo;
					};
					this.results.map(player => assign(player, getInfo(player.wyId)));
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}
}
