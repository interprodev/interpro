import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { AuthResponse, IterproTeamModule, PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	Agent,
	AgentApi,
	Bonus,
	Club,
	ClubSeason,
	ClubTransfer,
	ContractPersonModel,
	ContractPersonType,
	Customer,
	LoopBackAuth,
	Player,
	PlayerApi,
	PlayerTransfer,
	PlayerTransferApi,
	Staff,
	StaffApi,
	Team,
	TeamApi,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { ErrorService, ReportService, SportType, getPDFv2Path, sortByDate } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { pull } from 'lodash';
import * as moment from 'moment';
import { first, map } from 'rxjs/operators';
import { SquadsPersonAmortizationComponent } from './squads-person-amortization/squads-person-amortization.component';
import { SquadsPersonDetailsComponent } from './squads-person-details/squads-person-details.component';
import { SquadsPersonEvaluationComponent } from './squads-person-evaluation/squads-person-evaluation.component';
import { PlayerContractPDF } from './squads-person-legal/report';
import { SquadsPersonLegalComponent } from './squads-person-legal/squads-person-legal.component';

export enum SquadPersonIndexEnum {
	Overview = 0, // this is only for PlayerTransfer
	Details = 1,
	Legal = 2,
	Amortization = 3,
	Notes = 4
}

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person',
	templateUrl: './squads-person.component.html'
})
export class SquadsPersonComponent implements OnInit, OnChanges {
	@ViewChild(SquadsPersonAmortizationComponent, { static: false }) childForecast: SquadsPersonAmortizationComponent;
	@ViewChild(SquadsPersonEvaluationComponent, { static: false }) childEvaluation: SquadsPersonEvaluationComponent;
	@ViewChild(SquadsPersonDetailsComponent, { static: false }) childDetails: SquadsPersonDetailsComponent;
	@ViewChild(SquadsPersonLegalComponent, { static: false }) childContracts: SquadsPersonLegalComponent;
	@Input() contractIdParam: string;
	@Input() person: ContractPersonModel;
	@Input() personType: ContractPersonType;
	@Input() isPurchase = false;
	@Input() clubSeasons: ClubSeason[];
	@Input() players: Player[];
	@Input() editMode: boolean;
	@Input() activeIndex: number;
	@Input() isNew: boolean;
	@Input() deal: ClubTransfer;
	@Input() agents: Agent[];
	@Input() club: Club;
	@Input() deletedTransferContract = false;
	@Input() customers: Customer[];
	@Output() tabChangeEmitter: EventEmitter<{ index: number }> = new EventEmitter<{ index: number }>();
	@Output() removeFromSeasonEmitter: EventEmitter<object> = new EventEmitter<object>();
	@Output() contractsChangedEmitter: EventEmitter<void> = new EventEmitter<void>();
	seasons: TeamSeason[];
	team: Team;
	bonuses: Bonus[];
	customer: Customer;
	accessToLegal = false;
	sportType: SportType;
	hideDisabledModules = false;
	constructor(
		private error: ErrorService,
		private currentTeamService: CurrentTeamService,
		private reportService: ReportService,
		private auth: LoopBackAuth,
		private teamApi: TeamApi,
		private permissionsService: PermissionsService,
		private playerApi: PlayerApi,
		private staffApi: StaffApi,
		private agentApi: AgentApi,
		private playerTransferApi: PlayerTransferApi
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['person'] && this.person) {
			this.init();
		}
	}

	async ngOnInit() {
		this.customer = this.auth.getCurrentUserData();
		this.sportType = this.club.sportType as SportType;
		this.hideDisabledModules = this.club.sportType === 'agent';
		await this.checkAccessToLegal(this.person);
	}

	private init() {
		this.teamApi
			.getTeamSeasons(this.person.id ? this.person.teamId : this.currentTeamService.getCurrentTeam().id)
			.pipe(
				first(),
				untilDestroyed(this),
				map((seasons: TeamSeason[]) => (this.seasons = sortByDate(seasons, 'offseason').reverse()))
			)
			.subscribe({
				next: () => {
					if (this.personType == 'Player' || this.personType === 'PlayerTransfer') {
						this.getBonusData();
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getBonusData() {
		const obs = this.getPersonApi(this.personType).getBonuses(this.person.id, {
			active: true,
			type: 'all'
		});
		obs.pipe(first(), untilDestroyed(this)).subscribe({
			next: (res: Bonus[]) => (this.bonuses = res),
			error: (error: Error) => this.error.handleError(error)
		});
	}

	onTabChange(event: { index: number }) {
		this.tabChangeEmitter.emit(event);
	}

	canAccessToModule(module: IterproTeamModule, team = this.currentTeamService.getCurrentTeam()): AuthResponse {
		return this.permissionsService.canTeamAccessToModule(module, team);
	}

	private async checkAccessToLegal(person: ContractPersonModel) {
		this.accessToLegal = false;
		this.team = await this.teamApi.findById<Team>(person.teamId).toPromise();
		this.accessToLegal = this.canAccessToModule('legal', this.team).response;
	}

	getReport() {
		// const forecast = this.childForecast.getReportData(); // now amortization
		const evaluation = this.childEvaluation ? this.childEvaluation.getReportData() : {};
		const details = this.childDetails.getReportData();
		const contracts: PlayerContractPDF = this.childContracts.getReportData();
		const personId = this.person.id;

		const data = {
			// ...forecast,
			...evaluation,
			...details,
			...contracts,
			isPlayer: this.players.some(player => player.id === personId)
		};

		this.reportService
			.getImage(data.image)
			.pipe(first(), untilDestroyed(this))
			.subscribe(image => {
				this.reportService.getReport(
					getPDFv2Path('admin', 'admin_person_details', false),
					{ ...data, image },
					'',
					null,
					`${(this.person as Player | PlayerTransfer).name || (this.person as Staff | Agent).firstName} ${
						this.person.lastName
					} - Registry Report`
				);
			});
	}

	onRemoveFromSeasonTrigger(event) {
		this.teamApi
			.getTeamSeasons(this.person.teamId)
			.pipe(first(), untilDestroyed(this))
			.subscribe((newSeasons: TeamSeason[]) => {
				const newCurrent = newSeasons.find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
				);
				const oldCurrent = this.seasons.find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
				);
				if (event.flag && newCurrent) {
					newCurrent.playerIds = [...newCurrent.playerIds, this.person.id];
				}
				oldCurrent.playerIds = pull(oldCurrent.playerIds, this.person.id);
				oldCurrent.competitionInfo.forEach(competition => {
					competition.lineup = pull(competition.lineup, this.person.id);
				});
				this.removeFromSeasonEmitter.emit({
					...event,
					oldCurrent,
					newCurrent
				});
			});
	}

	private getPersonApi(personType: ContractPersonType): PlayerApi | StaffApi | AgentApi | PlayerTransferApi {
		switch (personType) {
			case 'Player':
			default:
				return this.playerApi;
			case 'Staff':
				return this.staffApi;
			case 'Agent':
				return this.agentApi;
			case 'PlayerTransfer':
				return this.playerTransferApi;
		}
	}
}
