import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerApi,
	LoopBackAuth,
	Player,
	PlayerApi,
	PlayerStatusLegendRow,
	Team,
	TeamGroup,
	TeamGroupApi,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { PlayersPipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	AvailabiltyService,
	AzureStoragePipe,
	CanComponentDeactivate,
	DEFAULT_PERSON_IMAGE_BASE64,
	EditModeService,
	ErrorService,
	NATIONALITIES,
	ReportService,
	SportType,
	feets,
	getFieldPosition,
	getLimb,
	getPlayerStatusLegendConfiguration,
	getPositionCategories,
	getPositions,
	getYears,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, uniq } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Observable, Observer, forkJoin, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, first, map, switchMap } from 'rxjs/operators';
import { SeasonStoreActions, SeasonStoreSelectors } from './../../+state';
import { RootStoreState } from '../../+state/root-store.state';
import { PlayersTableComponent } from '../../shared/players/players-table/players-table.component';
import { ApplyThresholdsToCustomValueService } from './thresholds/services/apply-thresholds-services/apply-thresholds-to-custom-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IterproOrgType } from '@iterpro/shared/data-access/permissions';

interface DropdownElement {
	team?: Team;
	player: Player;
	isTeam: boolean;
}

export interface PlayerRoleCategory {
	name: string;
	players: Player[];
}

const archiveCategories = [
	'sold',
	'onLoan',
	'notCalled',
	'expired',
	'disciplinary',
	'swap',
	'otherMotivation',
	'noPosition'
];

@UntilDestroy()
@Component({
	templateUrl: './my-team.component.html',
	styleUrls: ['./my-team.component.css'],
	animations: [
		trigger('toggleState', [
			state(
				'false',
				style({
					height: '0px'
				})
			),
			state(
				'true',
				style({
					height: '*'
				})
			),
			transition('true => false', animate('300ms cubic-bezier(0.86, 0, 0.07, 1)')),
			transition('false => true', animate('300ms cubic-bezier(0.86, 0, 0.07, 1)'))
		])
	]
})
export class MyTeamComponent implements CanComponentDeactivate, OnDestroy {
	seasons: TeamSeason[];
	playerViewType: MyTeamViewType = MyTeamViewType.Overview;
	playerViewTypes = MyTeamViewType;
	visibleUnarchive = false;
	playerArchived: Player;
	visible = false;
	playerToArchive: Player;
	tempPlayer: Player;
	players: Player[];
	allPlayers: Player[];
	archivedPlayers: Player[];
	selectedPlayer: Player;
	playerIdsList: any[] = [];
	currentDay: Date;
	filterPlayer = '';
	archivedListView: false;
	filters = [];
	selectedFilters = {};
	showCardViewFilters = false;
	showListViewFilters: boolean;
	user: Customer;
	discarded = false;
	form: NgForm;
	attributesEdit = false;
	attributesEditValue = '';
	currentGroups: TeamGroup[];
	viewTypes: MenuItem[] = [
		{
			id: 'cardView',
			label: 'admin.squads.cardView',
			icon: 'fas fa-id-card',
			command: () => this.activeViewType = this.viewTypes[0]
		},
		{
			id: 'listView',
			label: 'admin.squads.tableView',
			icon: 'fas fa-list',
			command: () => this.activeViewType = this.viewTypes[1]
		}
	];
	activeViewType: MenuItem = this.viewTypes[0];
	to: Date;
	from: Date;

	@ViewChild(PlayersTableComponent, { static: false }) playersTableChild: PlayersTableComponent;

	selectedSeason: TeamSeason;
	team: Team;
	searchDropdownElements: DropdownElement[];
	legendConfig: PlayerStatusLegendRow[] = getPlayerStatusLegendConfiguration(false);
	sportType: SportType = 'football';
	hideDisabledModules: boolean = false;
	categories: PlayerRoleCategory[] = [];
	archivedCategories: PlayerRoleCategory[] = [];
	categoryLabelForSkeletons: string[];
	isPlayersLoading: boolean;
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #seasonDefault$ = this.store$.select(SeasonStoreSelectors.selectDefault).pipe(takeUntilDestroyed());
	constructor(
		private route: ActivatedRoute,
		public editService: EditModeService,
		private store$: Store<RootStoreState>,
		private authStore: Store<AuthState>,
		private error: ErrorService,
		private customerApi: CustomerApi,
		private authService: LoopBackAuth,
		private playerApi: PlayerApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private translate: TranslateService,
		private playersPipe: PlayersPipe,
		private teamSeasonApi: TeamSeasonApi,
		private teamGroupsApi: TeamGroupApi,
		private reportService: ReportService,
		private azureUrlPipe: AzureStoragePipe,
		private availabilityService: AvailabiltyService,
		private applyThresholdsToCustomValueService: ApplyThresholdsToCustomValueService
	) {
		combineLatest([
			this.store$.select(AuthSelectors.selectSportType),
			this.store$.select(AuthSelectors.selectOrganizationType)
		])
			.pipe(untilDestroyed(this))
			.subscribe({
				next: ([sportType, orgType]: [SportType, IterproOrgType]) => {
					this.sportType = sportType;
					this.hideDisabledModules = orgType === 'agent';
					this.categoryLabelForSkeletons = getPositionCategories(this.sportType).map((roleName: string) => roleName);
				}
			});
		combineLatest([this.#currentTeam$, this.#seasonDefault$])
			.pipe(
				distinctUntilChanged(),
				filter(([team, season]) => !!team && !!season)
			)
			.subscribe({
				next: ([team, season]) => {
					this.team = team;
					this.setupFilters();
					this.initSeason(season);
				}
			});
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}

	ngOnDestroy() {
		this.store$.dispatch(SeasonStoreActions.resetSeasonSelection());
	}

	private listenForParams() {
		this.route.paramMap.pipe(first()).subscribe((params: ParamMap) => {
			const playerId = params.get('id');
			const tabIndex = params.get('tabIndex');
			if (playerId) {
				this.selectedPlayer = this.players.find(({ id }) => id === playerId);
				this.searchDropdownElements = this.getSearchDropdownElements(this.players);
				if (tabIndex) {
					this.playerViewType = Number(tabIndex);
				}
			}
		});
	}

	getSearchDropdownElements(persons: any[]): DropdownElement[] {
		return persons.filter(({ id }) => id !== this.selectedPlayer?.id).map(player => ({ player, isTeam: false }));
	}

	showViewEditButton(): boolean {
		return (
			!this.selectedPlayer.archived &&
			this.playerViewType !== MyTeamViewType.Fitness &&
			this.playerViewType !== MyTeamViewType.GameStats &&
			this.playerViewType !== MyTeamViewType.Robustness &&
			this.playerViewType !== MyTeamViewType.Attributes
		);
	}

	showViewDiscardButton(): boolean {
		return this.playerViewType !== MyTeamViewType.Attributes;
	}

	getReport() {
		if (this.activeViewType.id === 'listView') {
			this.getListReport();
		} else {
			this.getCardReport();
		}
	}

	toggleFilters() {
		if (this.activeViewType.id === 'listView') {
			this.showListViewFilters = !this.showListViewFilters;
		} else {
			this.showCardViewFilters = !this.showCardViewFilters;
		}
	}

	onViewChange() {
		this.showCardViewFilters = false;
		this.showListViewFilters = false;
	}

	private setupFilters() {
		const t = this.translate.instant.bind(this.translate);
		const tl = list => list.map(({ label, value }) => ({ label: t(label), value }));
		this.filters = [
			{
				name: 'nationalities',
				type: 'multiselect',
				label: t('profile.overview.nationality'),
				options: tl(NATIONALITIES),
				model: []
			},
			{
				name: 'feets',
				type: 'multiselect',
				label: t(`profile.position.${getLimb(this.sportType)}`),
				options: tl(feets),
				model: []
			},
			{
				name: 'years',
				type: 'multiselect',
				label: t('profile.overview.birth'),
				options: getYears(),
				model: []
			},
			{
				name: 'positions',
				type: 'multiselect',
				label: t('profile.position'),
				options: tl(getPositions('football')),
				model: []
			},
			{
				name: 'readiness',
				type: 'range',
				label: t('profile.player.readiness'),
				model: [0, 100],
				min: 0,
				max: 100
			},
			{
				name: 'weight',
				type: 'range',
				label: t('profile.overview.weight'),
				model: [0, 200],
				min: 0,
				max: 200
			},
			{
				name: 'height',
				type: 'range',
				label: t('profile.overview.height'),
				model: [0, 300],
				min: 0,
				max: 300
			},
			{
				name: 'shoeSize',
				type: 'range',
				label: t('profile.position.shoeSize'),
				model: [0, 60],
				min: 0,
				max: 60
			}
		];
	}

	changeFilter() {
		const selectedFilters = {};
		this.filters.forEach(({ name, model, type, min, max }) => {
			switch (type) {
				case 'range': {
					if (model[0] !== min || model[1] !== max) selectedFilters[name] = model;
					break;
				}
				case 'multiselect':
					selectedFilters[name] = model.map(({ value }) => value);
					break;
				default:
					selectedFilters[name] = model;
			}
		});
		this.selectedFilters = selectedFilters;
	}

	private initGroups() {
		this.teamSeasonApi
			.getGroups(this.selectedSeason.id, { order: 'name DESC' })
			.pipe(
				map((groups: TeamGroup[]) => (this.currentGroups = groups)),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private initPlayers() {
		return this.teamSeasonApi
			.getPlayers(this.selectedSeason.id, {
				include: [
					{
						relation: 'goScores',
						scope: {
							where: { and: [{ date: { gte: this.from } }, { date: { lte: this.to } }] },
							order: 'date DESC'
						}
					},
					{
						relation: 'injuries'
					},
					{
						relation: 'attributes'
					},
					{
						relation: 'descriptions'
					}
				],
				order: 'displayName DESC'
			})
			.pipe(
				map((players: Player[]) => {
					this.allPlayers = players;
					this.handlePlayers(this.allPlayers);
					this.searchDropdownElements = this.getSearchDropdownElements(this.players);
					return players;
				})
			);
	}

	private handleChangePosition(player: Player) {
		const obsArray = [];
		const from =
			!!this.tempPlayer && !!this.tempPlayer.position
				? this.currentGroups.find(({ name }) => name === this.translate.instant(this.tempPlayer.position))
				: undefined;

		const to = player.position
			? this.currentGroups.find(({ name }) => name === this.translate.instant(player.position))
			: undefined;

		if (from) {
			// il gruppo origine è presente (alias, il giocatore aveva già una position setttata)
			const foundIndex = from.players.findIndex(id => String(id) === String(player.id));
			if (foundIndex !== -1) from.players.splice(foundIndex, 1);

			obsArray.push(this.teamGroupsApi.updateAttributes(from.id, from));
		}
		if (to) {
			// se il gruppo di destinazione esiste
			to.players = uniq([...to.players, player.id]);

			obsArray.push(this.teamGroupsApi.updateAttributes(to.id, to));
		} else if (player.position) {
			// se il gruppo destinazione non esiste
			const toCreate = {
				name: this.translate.instant(player.position),
				teamId: this.authService.getCurrentUserData().currentTeamId,
				players: [player.id]
			};
			obsArray.push(this.teamGroupsApi.create(toCreate));
		}
		if (obsArray.length > 0) {
			forkJoin(obsArray)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: () => {
						this.initGroups();
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	closeAttributesEdit() {
		this.attributesEdit = false;
	}

	private handlePlayers(players: any[]) {
		players.forEach(player => {
			const chronicIds = player._chronicInjuries.map(({ id }) => id);
			player.flaredUp = player.injuries.find(
				injury =>
					injury.currentStatus !== 'medical.infirmary.details.statusList.healed' &&
					chronicIds.includes(injury.chronicInjuryId)
			);
		});
		players = sortByName(players, 'displayName');
		this.players = players.filter(({ archived }) => archived === false);
		this.archivedPlayers = players.filter(({ archived }) => archived === true);
		this.scaffoldPlayers(this.players, this.archivedPlayers);
		this.listenForParams();
	}

	private scaffoldPlayers(players: Player[], archivedPlayers: Player[]) {
		players = players.filter(({ archived }) => archived === false);
		this.categories = [
			...getPositionCategories(this.sportType).map((roleName: string) => ({
				name: roleName,
				players: []
			})),
			{ name: 'noPosition', players: [] }
		];
		this.archivedCategories = [
			...archiveCategories.map((roleName: string) => ({
				name: roleName,
				players: []
			}))
		];

		players.forEach(player => {
			const category = this.categorizeActivePlayer(player.position);
			this.categories = this.categories.map((item: PlayerRoleCategory) => {
				if (category === item.name) {
					return {
						...item,
						players: [...item.players, <Player>(<unknown>player)]
					};
				}
				return item;
			});
		});

		archivedPlayers.forEach(player => {
			const category = this.categorizeArchivedPlayer(player.currentStatus);
			this.archivedCategories = this.archivedCategories.map((item: PlayerRoleCategory) => {
				if (category === item.name) {
					return {
						...item,
						players: [...item.players, <Player>(<unknown>player)]
					};
				}
				return item;
			});
		});
		this.isPlayersLoading = false;
	}

	private categorizeActivePlayer(position: string): string {
		if (!position) return 'noPosition';
		const category = getFieldPosition(position, this.sportType);
		return category ? category : 'noPosition';
	}

	private categorizeArchivedPlayer(status: string): string {
		switch (status) {
			case 'sold':
			case 'onLoan':
			case 'notCalled':
			case 'expired':
			case 'disciplinary':
			case 'swap':
				return status;
			default:
				return 'otherMotivation';
		}
	}

	onClickPlayer(player: Player) {
		this.selectedPlayer = player;
		this.searchDropdownElements = this.getSearchDropdownElements(this.players);
	}

	onCloseProfile() {
		this.selectedPlayer = null;
		this.loadPlayers();
	}

	loadPlayers() {
		this.initPlayers()
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private onSavePlayer(player: Player) {
		const { id, ...playerData } = player;
		if (this.tempPlayer) {
			const thresholdFormatChanged = this.isThresholdFormatChanged(playerData);
			if (thresholdFormatChanged) {
				const { currentTeamId } = this.authService.getCurrentUserData();
				this.applyThresholdsToCustomValueService.triggerThresholdsUpdate(currentTeamId, this.selectedSeason.id, [id]);
			}
		}

		this.playerApi
			.patchAttributes(id, playerData)
			.pipe(
				first(),
				untilDestroyed(this),
				map((updatedPlayer: Player) => {
					this.handleChangePosition(updatedPlayer);
					return updatedPlayer;
				}),
				switchMap(() => this.initPlayers())
			)
			.subscribe({
				next: () => {
					this.editService.editMode = false;
					this.discarded = false;
					this.visible = false;
					this.visibleUnarchive = false;
					this.notificationService.notify(
						'success',
						this.translate.instant('navigator.profile'),
						'alert.recordUpdated',
						false
					);
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private isThresholdFormatChanged({ _thresholdsTests, _thresholdsPlayer }): boolean {
		const { _thresholdsTests: tempThresholdsTest, _thresholdsPlayer: tempThresholdsPlayer } = this.tempPlayer;
		const tempFormats = [...tempThresholdsTest, ...tempThresholdsPlayer].map(({ format }) => format);
		const currentFormats = [..._thresholdsTests, ..._thresholdsPlayer].map(({ format }) => format);
		const isChanged = JSON.stringify(tempFormats) !== JSON.stringify(currentFormats);
		return isChanged;
	}
	onEditPlayer() {
		this.tempPlayer = cloneDeep(this.selectedPlayer);
		this.editService.editMode = true;
		this.discarded = false;
	}

	onDiscard() {
		this.selectedPlayer = cloneDeep(this.tempPlayer);
		this.editService.editMode = false;
		this.discarded = true;
	}

	private getProfileUrl(player: Player): string {
		return player.downloadUrl ? this.azureUrlPipe.transform(player.downloadUrl) : DEFAULT_PERSON_IMAGE_BASE64;
	}

	private getPointColor(player: Player): string {
		return this.availabilityService.getCurrentHealthStatusColor(player);
	}

	onSavePlayerAttributes(player: Player) {
		this.selectedPlayer = player;
		this.confirmEdit(player);
	}

	confirmPlayerFormSubmit(f: NgForm) {
		this.form = f;
		this.confirmEdit(this.selectedPlayer);
	}

	private confirmEdit(player: Player) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.onSavePlayer(player);
			},
			reject: () => {}
		});
	}

	onTabChange(event) {
		this.playerViewType = event.index;
	}

	private getListReport() {
		this.playersTableChild.getListReportPDF();
	}

	private getCardReport() {
		const t = this.translate.instant.bind(this.translate);
		const toPlayer = player => ({
			name: player.name,
			displayName: player.displayName,
			image: this.getProfileUrl(player),
			position: player.position,
			nationality: player.nationality,
			year: player.birthDate && moment(player.birthDate).format('YY'),
			readiness: this.getPointColor(player),
			icons: [
				player.flaredUp && { class: 'fas fa-fire', color: 'var(--color-primary-500)' },
				player.injured && { class: player.injured }
			].filter(i => i)
		});
		const f = players => this.playersPipe.transform(players, this.filterPlayer, this.selectedFilters);
		const categories = [
			...this.categories.map(({ name, players }) => ({
				title: t(`roles.categories.${name}${name === 'noPosition' ? '' : 's'}`),
				players: f(players).map(toPlayer)
			}))
		];

		const data = { categories };
		this.reportService.getReport('profile_squad', data, '', null, `${this.team.name} - Squad Profile`);
	}

	private initSeason(season: TeamSeason) {
		this.isPlayersLoading = true;
		this.selectedSeason = season;
		const { id, offseason, inseasonEnd } = this.selectedSeason;
		const { currentTeamId } = this.authService.getCurrentUserData();
		// If I'm seeing an older season, I'll take as reference for date period the end of that season, otherwise I'll take today
		const day = moment().isBetween(offseason, inseasonEnd) ? moment().toDate() : inseasonEnd;
		this.from = moment(day).subtract(2, 'days').startOf('day').toDate();
		this.to = moment(day).endOf('day').toDate();
		forkJoin([
			this.customerApi.getCurrent({
				include: {
					relation: 'teamSettings',
					scope: {
						where: {
							teamId: currentTeamId
						}
					}
				}
			}),
			this.teamSeasonApi.getGroups(id, { order: 'name DESC' }),
			this.teamSeasonApi.getPlayers(id, {
				include: [
					{
						relation: 'goScores',
						scope: {
							where: { and: [{ date: { gte: this.from } }, { date: { lte: this.to } }] },
							order: 'date DESC'
						}
					},
					{
						relation: 'injuries'
					},
					{
						relation: 'attributes'
					},
					{
						relation: 'descriptions'
					}
				],
				order: 'displayName DESC'
			}),
			this.teamSeasonApi.find({
				where: { teamId: currentTeamId },
				order: 'offseason DESC'
			})
		])
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([user, currentGroups, allPlayers, seasons]: [Customer, TeamGroup[], Player[], TeamSeason[]]) => {
					this.user = user;
					this.currentGroups = currentGroups;
					this.allPlayers = allPlayers;
					this.seasons = seasons;
					this.handlePlayers(this.allPlayers);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSelectFromDropdown(value: DropdownElement) {
		this.onClickPlayer(value.player);
	}

	originalOrder = (a, b): number => 0;
}

enum MyTeamViewType {
	Overview = 0,
	Attributes = 1,
	GameStats = 2,
	Fitness = 3,
	Robustness = 4,
	Threshold = 5
}
