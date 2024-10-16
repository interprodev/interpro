import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	ContractOptionCondition,
	LoopBackAuth,
	Match,
	Player,
	Staff,
	Team,
	TeamBonus,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { CompetitionsConstantsService, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import {
	booleanRelationOptions,
	competitions,
	nationalsApp,
	phases,
	teamActions,
	teamActionsGoal,
	teams
} from 'src/app/squads/squads-person/squads-person-legal/utils/contract-options';
import { v4 as uuid } from 'uuid';

@Component({
	selector: 'iterpro-team-bonus-builder',
	templateUrl: './team-bonus-builder.component.html',
	styleUrls: ['./team-bonus-builder.component.css']
})
export class TeamBonusBuilderComponent implements OnInit, OnChanges {
	@Input() visible: boolean;
	@Input() players: SelectItem<Player>[];
	@Input() staff: SelectItem<Staff>[];
	@Input() matches: Match[];
	@Input() seasons: TeamSeason[];
	@Input() team: Team;
	@Input() edit = false;
	@Input() bonus: TeamBonus;
	@Output() discardEmitter: EventEmitter<void> = new EventEmitter<void>();
	@Output() saveEmitter: EventEmitter<TeamBonus> = new EventEmitter<TeamBonus>();

	listPlayers: SelectItem[] = [];
	listStaff: SelectItem[] = [];
	selectedPlayersIds: string[] = [];
	selectedStaffIds: string[] = [];
	each: string;
	listMatches: SelectItem[] = [];
	nationalsApp: SelectItem[] = nationalsApp;
	teams: SelectItem[] = teams;
	competitions: SelectItem[] = competitions;
	booleanRelationOptions: SelectItem[] = booleanRelationOptions;
	phases = phases;
	teamActions: SelectItem[];
	teamActionsGoal: SelectItem[];
	currency: string;
	seasonOptions: SelectItem[];

	matchActions: SelectItem[] = [
		{ label: 'win', value: 'win' },
		{ label: 'draw', value: 'draw' }
	];
	bonusBackup: TeamBonus;
	today: Date;

	constructor(
		private auth: LoopBackAuth,
		private translate: TranslateService,
		private currentTeamService: CurrentTeamService,
		private competitionsService: CompetitionsConstantsService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['visible']) {
			if (this.visible === true) this.bonusBackup = cloneDeep(this.bonus);
		}
	}

	ngOnInit() {
		this.today = moment().toDate();
		this.currency = this.currentTeamService.getCurrency();
		this.listPlayers = this.players.map(x => ({
			label: x.value.displayName,
			value: x.value.id
		}));
		this.listStaff = this.staff.map(x => ({
			label: `${x.value.firstName} ${x.value.lastName}`,
			value: x.value.id
		}));
		this.listMatches = this.matches?.map(x => ({
			label: `${moment(x.date).format(getMomentFormatFromStorage())} - ${x.opponent} ${
				x.result
			} (${this.translate.instant(x.home ? 'home' : 'away')})`,
			value: x.id
		}));
		this.matchActions = this.matchActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.seasonOptions = [
			{ label: this.translate.instant('allContract'), value: 'allContract' },
			...this.seasons.map(x => ({ label: x.name, value: x.id }))
		];
		this.nationalsApp = this.nationalsApp.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.phases = this.phases.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teams = this.teams.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActions = teamActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActionsGoal = teamActionsGoal.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));

		// TODO: this is shared code that should belong to a service
		const currentSeason = this.currentTeamService.getCurrentSeason();
		const { competitionInfo = [], wyscoutAreas = [], instatAreas = [] } = currentSeason;
		const seasonCompetitions =
			competitionInfo.length > 0
				? competitionInfo.map(info => {
						const data = this.competitionsService.getCompetitionFromJson(info.competition) || info;
						return { label: this.translate.instant(data.name), value: data.wyId || data.competition };
				  })
				: wyscoutAreas.length > 0 || instatAreas.length > 0
				? this.competitionsService.getCompetitionsByAreas(currentSeason?.wyscoutAreas || []).map(c => ({
						label: this.translate.instant(c.label),
						value: c.value
				  }))
				: competitions.map(x => ({
						label: this.translate.instant(x.label),
						value: x.value
				  }));
		// end of shared code that should belong to a service
		this.competitions = [
			{
				label: this.translate.instant('allActiveCompetitions'),
				value: 'allActiveCompetitions'
			},
			...seasonCompetitions,
			...this.teams
		];
		if (this.bonus.conditions && this.bonus.conditions.length)
			this.bonus.conditions.forEach(x => {
				if (!x.id) x.id = uuid();
			});
		this.loadPeople();
	}

	discard() {
		this.bonus = cloneDeep(this.bonusBackup);
		this.discardEmitter.emit();
	}

	save() {
		this.saveEmitter.emit(this.bonus);
	}

	onTotalInsert(event: number) {
		this.bonus.amount = event;
		this.each = this.bonus.amount
			? Number(
					(this.bonus.amount / (this.selectedPlayersIds.length + this.selectedStaffIds.length) || 0).toFixed(0)
			  ).toFixed(2)
			: null;
	}

	onEachInsert(event: string) {
		this.each = event;
		this.bonus.amount = Number(this.each) * (this.selectedPlayersIds.length + this.selectedStaffIds.length) || 0;
	}

	updatePeople() {
		this.bonus.people = [...this.selectedPlayersIds, ...this.selectedStaffIds];
		this.onTotalInsert(this.bonus.amount);
	}

	// getResultFlag() {
	// 	return this.bonus && this.bonus.matchId ? this.matches.find(x => x.id === this.bonus.matchId).resultFlag : null;
	// }

	loadPeople() {
		this.selectedPlayersIds = ((this.bonus?.people as string[]) || []).filter(peopleId =>
			this.listPlayers.map(i => i.value).includes(peopleId)
		);
		this.selectedStaffIds = ((this.bonus?.people as string[]) || []).filter(peopleId =>
			this.listStaff.map(i => i.value).includes(peopleId)
		);
		this.onTotalInsert(this.bonus.amount);
	}

	isDisabled(bonus: TeamBonus): boolean {
		if (!bonus.type) return true;
		else if (!(bonus.people && bonus.people.length)) return true;
		else if (bonus.type === 'match') {
			return (bonus.conditions || []).some((cond: ContractOptionCondition) => !cond.action || !cond.matchId);
		} else if (bonus.type === 'performance') {
			return (bonus.conditions || []).some(
				(cond: ContractOptionCondition) =>
					!cond.action ||
					(cond.action && cond.action === 'achieves' && !cond.action) ||
					!(cond.seasons && cond.seasons.length) ||
					!(cond.competitions && cond.competitions.length)
			);
		} else if (bonus.type === 'generic') {
			return (bonus.conditions || []).some((cond: ContractOptionCondition) => !cond.action);
		} else return true;
	}

	alreadyPaid(): boolean {
		return this.bonusBackup && this.bonusBackup.paid === true;
	}

	addCondition() {
		const condition: ContractOptionCondition = new ContractOptionCondition({
			_id: uuid(),
			type: this.bonus.type,
			phases: [],
			competitions: [],
			seasons: [],
			action: null,
			count: null,
			count2: null,
			goal: null,
			team: null,
			custom: null,
			startDate: undefined,
			untilDate: undefined,
			membershipDate: undefined,
			soldDate: undefined,
			soldAmount: null,
			condition: null,
			matchId: null,
			seasonsRelationFlag: booleanRelationOptions[0].value,
			competitionsRelationFlag: booleanRelationOptions[0].value,
			bonusCap: null,
			progress: undefined
		});
		this.bonus.conditions = [...(this.bonus?.conditions || []), { ...condition, seasons: [] }];
	}

	removeCondition(index: number) {
		this.bonus.conditions.splice(index, 1);
	}

	cloneCondition(index: number) {
		const clone = cloneDeep(this.bonus.conditions[index]);
		clone.id = uuid();
		this.bonus.conditions = [
			...this.bonus.conditions.slice(0, index + 1),
			clone,
			...this.bonus.conditions.slice(index + 1)
		];
	}

	onChange(element: string, index?: number) {
		switch (element) {
			case 'bonus.season':
				if (index !== null)
					if (this.bonus.conditions[index].seasons.includes('allContract'))
						this.bonus.conditions[index].seasons = ['allContract'];
				break;
		}
	}

	onChangeCompetitions(element: string, index?: number) {
		switch (element) {
			case 'bonus.competition':
				if (index !== null)
					if (this.bonus.conditions[index].competitions.includes('allActiveCompetitions'))
						this.bonus.conditions[index].competitions = ['allActiveCompetitions'];
				break;
		}
	}

	updateToSave(event: string, bonus: TeamBonus) {
		const today = moment().toDate();
		if (event === 'reached') {
			bonus.achievedDate = today;
		} else {
			bonus[`${event}Date`] = today;
		}
		bonus[`${event}CustomerId`] = this.auth.getCurrentUserId();
	}

	onBonusTypeChange(type: 'match' | 'performance' | 'generic') {
		this.bonus = {
			...this.bonus,
			conditions: (this.bonus?.conditions || []).map(cond => ({
				...cond,
				type: type
			}))
		};
	}
}
