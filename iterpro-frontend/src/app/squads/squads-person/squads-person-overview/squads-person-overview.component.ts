import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	Club,
	ClubApi,
	ClubSeason,
	ClubTransfer,
	EmploymentContract,
	LoopBackAuth,
	PlayerTransfer,
	TransferContract,
	TransferWindowItem
} from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	BlockUiInterceptorService,
	ErrorService,
	ProviderIntegrationService,
	SportType,
	getActiveEmploymentContract,
	getActiveTransferContract,
	getTotalElementsAmountForSeasonNew
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { NetSalaryPipe } from 'src/app/transfers/shared/pipes/net-salary.pipe';

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person-overview',
	templateUrl: './squads-person-overview.component.html',
	styleUrls: ['./squads-person-overview.component.css'],
	providers: [ShortNumberPipe, DecimalPipe, NetSalaryPipe]
})
export class SquadsPersonOverviewComponent implements OnInit, OnChanges {
	@Input() editMode: boolean;
	@Input() person: PlayerTransfer;
	@Input() readonly agents: Agent[];
	@Input() deal: ClubTransfer;
	@Input() readonly clubSeasons: ClubSeason[];
	@Input() sportType: SportType;
	inwardStatusInfo: TransferContract;
	outwardStatusInfo: TransferContract;
	clubSeasonOptions: SelectItemGroup[] = [];
	inward: TransferContract;
	club: Club;
	clubOption: SelectItem;
	selectedTransferWindow: TransferWindowItem;
	currency: string;
	thirdPartyClubs: SelectItem[] = [];
	activeEmploymentContract: EmploymentContract;
	agentsLabel: string;
	constructor(
		private millionsPipe: ShortNumberPipe,
		private clubApi: ClubApi,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private numberPipe: DecimalPipe,
		public translate: TranslateService,
		private azurePipe: AzureStoragePipe,
		private currentTeamService: CurrentTeamService,
		private providerIntegrationService: ProviderIntegrationService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['person'] && this.person) {
			this.getClub();
			this.activeEmploymentContract = getActiveEmploymentContract(this.person);
			const activeInwardContract = getActiveTransferContract(this.deal.player, 'inward');
			const activeOutwardContract = getActiveTransferContract(this.deal.player, 'outward');
			this.inwardStatusInfo = activeInwardContract;
			this.outwardStatusInfo = activeOutwardContract;
			this.inward = activeInwardContract;
			const contract = this.deal.isPurchase ? activeInwardContract : activeOutwardContract;
			this.agentsLabel = this.agents
				.filter(({ id }) => (contract?.agentContracts || []).map(({ agentId }) => agentId).includes(id))
				.map(({ firstName, lastName }) => `${firstName} ${lastName}`)
				.join(', ');
		}
	}

	ngOnInit() {
		// setup for dropdown
		this.setup();
		// set the transfer model
		this.setClubTransferModel();
		this.currency = this.currentTeamService.getCurrency();
	}

	private getClub() {
		let obs$: Observable<Club>;
		if (this.deal) {
			if (this.deal.isPurchase) {
				if (this.inward && this.inward.club) this.clubOption = { label: this.inward.club, value: null };
				obs$ =
					this.inward && this.inward.club
						? of(this.inward.club).pipe(
								distinctUntilChanged(),
								debounceTime(1000),
								switchMap(query => this.providerIntegrationService.searchTeam(query.toString(), true)),
								untilDestroyed(this)
							)
						: of({ label: '', value: null });
			} else {
				obs$ = this.clubApi
					.findById(this.auth.getCurrentUserData().clubId, { fields: ['id', 'name'] })
					.pipe(untilDestroyed(this)) as Observable<Club>;
			}
			this.blockUiInterceptorService.disableOnce(obs$).subscribe({
				next: (response: Club) => {
					if (Array.isArray(response)) {
						this.onThirdPartyClubsReceived(response, this.inward.club);
						this.clubOption = this.thirdPartyClubs.find(({ value, label }) => value === this.inward.club || label === this.inward.club);
					} else {
						this.club = response;
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
		}
	}

	search(event: { query: string }) {
		this.blockUiInterceptorService
			.disableOnce(
				of(event).pipe(
					map((event: { query: string }) => event.query),
					filter((query: string) => query && query.length > 2),
					distinctUntilChanged(),
					debounceTime(1000),
					switchMap(query => this.providerIntegrationService.searchTeam(query, false))
				)
			)
			.subscribe(
				data => this.onThirdPartyClubsReceived(data, event.query),
				error => this.error.handleError(error)
			);
	}

	private onThirdPartyClubsReceived(data: { officialName: string; wyId: number }[], query: string) {
		if (data.length === 0) {
			this.thirdPartyClubs = [];
			if (this.inward) this.inward.club = query;
		} else {
			this.thirdPartyClubs = data.map(x => ({ label: x.officialName, value: x.wyId }));
		}
	}

	selectClub(event: AutoCompleteSelectEvent) {
		if (this.inward) this.inward.club = event.value.value;
	}

	/**
	 * @description set the dropdown options
	 */
	private setup() {
		// prepare object for dropdown
		if (this.clubSeasons.length) {
			// get only records with name, club season id and transfer window id
			const seasons: ClubSeason[] = this.clubSeasons.filter(({ _transferWindows }) =>
				_transferWindows.find(transferWindow => transferWindow.name && transferWindow.id && transferWindow.id)
			);

			this.clubSeasonOptions = seasons.map(clubSeason => {
				return {
					label: clubSeason.name,
					value: clubSeason._transferWindows,
					items: clubSeason._transferWindows.map(transferWindow => ({
						label: clubSeason.name + ' ' + transferWindow.name,
						value: {
							transferWindowId: transferWindow.id,
							clubSeasonId: clubSeason.id
						}
					}))
				};
			});
		}
	}

	/**
	 * @description set the transfer model to save
	 */
	private setClubTransferModel() {
		this.selectedTransferWindow = {
			transferWindowId: this.deal.transferWindowId,
			clubSeasonId: this.deal.clubSeasonId
		};
	}

	/**
	 * @description edit transfer model and merge with deals input
	 * @param event - take the chosen transfer model
	 */
	editTransfer(event: { value: any }) {
		Object.assign(this.deal, event.value);
	}

	getSalary(): string {
		if (this.activeEmploymentContract) {
			return `${this.currency}${this.millionsPipe.transform(
				Number(
					this.numberPipe.transform(
						getTotalElementsAmountForSeasonNew(this.activeEmploymentContract, this.activeEmploymentContract.basicWages, false, null),
						'0.0-3'
					)
				),
				true
			)}`;
		} else return '-';
	}

	getLangClass(lang: string): string {
		if (lang) {
			return 'flag-icon-' + lang.toLowerCase();
		} else {
			return '';
		}
	}
}
