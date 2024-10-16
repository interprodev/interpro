import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Injector, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerApi,
	DeviceMetricDescriptor,
	EventApi,
	GOScore,
	GOScoreApi,
	LoopBackAuth,
	Match,
	MatchApi,
	Player,
	PlayerStat,
	TacticsData,
	TacticsPlayerData,
	Team,
	TeamGroup,
	TeamSeason,
	TeamSeasonApi,
	TeamStat,
	Threshold,
	VideoAsset,
	VideoCategory
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	BlockUiInterceptorService,
	CompetitionsConstantsService,
	ErrorService,
	ProviderIntegrationService,
	VideoMatchesService,
	copyValue,
	getFormatFromStorage,
	getMomentFormatFromStorage,
	getTacticsList,
	isGroup,
	isNotEmpty,
	sortByDate,
	sortByDateDesc,
	sortByName,
	splitArrayInChunks,
	getTeamSettings,
	VideoService,
	getResult
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty, sortBy } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { SelectItem } from 'primeng/api';
import { Observable, Subscription, forkJoin, from, of } from 'rxjs';
import { concatMap, first, map, take, tap } from 'rxjs/operators';
import { VideoGuard } from '../shared/services/video.guard';
import { SeasonStoreActions, SeasonStoreSelectors } from './../../+state';
import { RootStoreState } from '../../+state/root-store.state';

export enum TacticsViewState {
	Preparation = 0,
	Analysis = 1
}

export enum InjuryAvailability {
	Ok = 0,
	NotAvailable = 1,
	BeCareful = 2
}

const moment = extendMoment(Moment);

@UntilDestroy()
@Component({
	templateUrl: './tactics.component.html',
	styleUrls: ['./tactics.component.css']
})
export class TacticsComponent extends EtlBaseInjectable implements OnInit, OnDestroy {
	idParam: any;
	openedPhase: string;
	openedPlayer: Player;
	tempPlayer: TacticsPlayerData;
	dialogPlayer: TacticsPlayerData;
	displayPlayerDialog: boolean;
	selectedAnalysis: number;
	currentViewState: TacticsViewState = TacticsViewState.Preparation;
	currentViewStates = TacticsViewState;
	selectedType = 'summary';
	analysisType = [
		{ label: 'Summary', value: 'summary' },
		{ label: 'Comparison', value: 'comparison' }
	];
	tacticsList: SelectItem<string>[] = [];
	matchList: SelectItem[] = [];
	matchListAnalysis: SelectItem[] = [];
	playerList: Player[];
	match: Match;
	matches: Array<Match & { crest?: string }>;
	teamStat: TeamStat;
	playerStats: PlayerStat[];
	playerStatList: SelectItem[] = [];
	selectedPlayerStat: PlayerStat;
	playerStatListComparison: SelectItem[] = [];
	selectedPlayerStatComparison: any[];
	bench: Player[];
	playerView = false;
	metricsTeamOptions: SelectItem[] = [];
	metricsIndividualOptions: SelectItem[] = [];
	selectedMetricPlayer: DeviceMetricDescriptor[] = [];
	selectedMetricTeam: DeviceMetricDescriptor[] = [];
	currentUser: Customer;
	currentTeam: Team;
	currentThresholds: Threshold[] = [];
	metricsTeam: DeviceMetricDescriptor[] = [];
	metricsPlayer: DeviceMetricDescriptor[] = [];
	injuryMapPlayer: Map<string, any>;
	phaseList: SelectItem[] = [];
	selectedPhase: TacticsData;
	phaseItem: any;
	matchItem: Match;
	display = false;
	comparisonThresholdsMap: Map<string, any[]> = new Map<string, any[]>();
	sidebarOpen = true;
	route$: Subscription;
	pastMatches: any;
	private selectedSeason: TeamSeason;

	private cacheCrests: Team[] = [];

	videoMatches$: Observable<VideoAsset[]>;
	videos$: Observable<VideoAsset[]>;
	videoSubscription: Subscription;
	videosLength = 0;
	isSavingSelectedTactics = false;
	sportType: string;

	constructor(
		private store$: Store<RootStoreState>,
		private error: ErrorService,
		private authService: LoopBackAuth,
		private matchApi: MatchApi,
		private notificationService: AlertService,
		private customerApi: CustomerApi,
		private translate: TranslateService,
		private route: ActivatedRoute,
		private teamSeasonApi: TeamSeasonApi,
		private currentTeamService: CurrentTeamService,
		private competitionService: CompetitionsConstantsService,
		private videoGuard: VideoGuard,
		private datePipe: DatePipe,
		private videoMatchesService: VideoMatchesService,
		private goScoreApi: GOScoreApi,
		private providerIntegrationService: ProviderIntegrationService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private eventApi: EventApi,
		private cdRef: ChangeDetectorRef,
		private videoService: VideoService,
		injector: Injector
	) {
		super(injector);
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({ next: (type: string) => (this.sportType = type) });

		this.translate.getTranslation(this.translate.currentLang).subscribe((x: any) => (this.translate = translate));
	}
	@HostListener('window:beforeunload')
	canDeactivate() {
		return this.videoGuard.canDeactivate();
	}

	ngOnDestroy() {
		this.store$.dispatch(SeasonStoreActions.resetSeasonSelection());
		if (this.match) this.saveTactics();
		if (this.route$) {
			this.idParam = null;
		}
		if (this.videoSubscription) this.videoSubscription.unsubscribe();
	}

	ngOnInit() {
		this.getMatchReport = this.getMatchReport.bind(this);

		this.route$ = this.route.paramMap.pipe(untilDestroyed(this)).subscribe({
			next: (params: ParamMap) => {
				this.idParam = params['params'] ? params['params'].id : null;
			}
		});

		this.store$
			.select(SeasonStoreSelectors.selectDefault)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (season: TeamSeason) => {
					this.getData(season);
					this.loadMenuItem();
				}
			});
		this.listenToUploadSuccess();
	}

	private getData(season: TeamSeason = this.currentTeamService.getCurrentSeason()) {
		this.selectedSeason = season;
		this.selectedSeason = this.currentTeamService.getCurrentSeason(); // TODO: remove when store is fully working
		this.currentTeam = this.currentTeamService.getCurrentTeam();

		const $customer = this.customerApi
			.getCurrent({
				include: {
					relation: 'teamSettings',
					scope: {
						where: {
							teamId: this.authService.getCurrentUserData().currentTeamId
						}
					}
				}
			})
			.pipe(map((customer: Customer) => (this.currentUser = customer)));

		const { id } = season;

		const $players = this.teamSeasonApi
			.getPlayers(id, {
				include: ['injuries', 'attributes'],
				fields: [
					'id',
					'displayName',
					'downloadUrl',
					'archived',
					'archivedDate',
					'position',
					'injuries',
					'attributes',
					'goScores',
					'_thresholdsPlayer',
					'weight',
					'height',
					'foot',
					'birthDate'
				]
			})
			.pipe(
				map((players: Player[]) => (this.playerList = players)),
				tap(() => {
					if (this.playerList.some(({ id: playerId }) => !playerId)) {
						this.notificationService.notify('error', 'navigator.tactics', 'alert.playerError', false);
					}
				})
			);

		const $matches = this.matchApi
			.find({
				where: {
					teamSeasonId: id
				},
				order: 'date DESC',
				include: [
					{
						relation: 'event',
						scope: {
							fields: [
								'format',
								'id',
								'subformat',
								'subformatDetails',
								'_attachments',
								'opponentId',
								'resultFlag',
								'opponentImageUrl',
								'opponentWyscoutId',
								'opponentInstatId'
							]
						}
					}
				]
			})
			.pipe(
				tap((matches: Match[]) => {
					if (isEmpty(matches))
						this.notificationService.notify('warn', 'navigator.tactics', 'alert.noMatchFound', false);
				})
			);

		const $groups = this.teamSeasonApi.getGroups(id).pipe(
			map((teamGroups: TeamGroup[]) => {
				this.currentTeam = {
					...this.currentTeamService.getCurrentTeam(),
					teamGroups
				};
			})
		);

		forkJoin([$customer, $players, $matches, $groups])
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([, , matches]) => {
					this.initMetrics();
					this.prepareMatchData(matches, season);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private initMetrics() {
		this.teamStat = new TeamStat();

		const { metricsTeamTactical = [], metricsIndividualTactical = [] } = getTeamSettings(
			this.currentUser.teamSettings,
			this.currentTeam.id
		);

		this.metricsTeamOptions = [];

		metricsTeamTactical.forEach(metric => {
			for (const m of this.etlTeamService.getMetricsMapping()) {
				if (m.metricName === metric) {
					this.metricsTeam.push(m);
					this.metricsTeamOptions.push({ label: m.metricLabel, value: m });
				}
			}
		});

		this.metricsIndividualOptions = [];
		metricsIndividualTactical.forEach(metric => {
			for (const m of this.etlPlayerService.getMetricsMapping()) {
				if (m.metricName === metric) {
					this.metricsPlayer.push(m);
					this.metricsIndividualOptions.push({ label: m.metricLabel, value: m });
				}
			}
		});

		if (this.metricsIndividualOptions.length === 0 || this.metricsTeamOptions.length === 0) {
			this.notificationService.notify('error', 'tactics', 'alert.noTacticalMetricsFound', false);
		}
	}

	private prepareMatchData(matches: Match[], season: TeamSeason) {
		matches.forEach((match: any) => {
			match.opponentId = match.event?.opponentId || match.event?.opponentWyscoutId || match.event?.opponentInstatId;
			match.crest = match.event?.opponentImageUrl;
			match.resultFlag = match.event?.resultFlag;
		});
		const { totalMatches = [], pastMatches = [] } = this.setMatches(matches, season);
		this.matches = totalMatches;
		this.pastMatches = pastMatches;
		this.matchList = this.matches.map(match => ({
			label: `${match.opponent} - ${moment(match.date).format(getMomentFormatFromStorage())}`,
			value: match
		}));
		this.matchListAnalysis = this.pastMatches
			.filter(({ event }) => event?.format !== 'friendly')
			.map(match => ({
				label: `${match.opponent} - ${moment(match.date).format(getMomentFormatFromStorage())}`,
				value: match
			}));
		this.match = this.getClosestMatch(
			this.currentViewState === TacticsViewState.Analysis ? this.pastMatches : this.matches
		);
		this.matchItem = this.match;
		if (this.currentViewState === TacticsViewState.Preparation) {
			if (this.idParam) {
				const found = this.matchList.find(({ value }) => value.eventId === this.idParam);
				this.handleMatchSelect(found);
				this.currentViewState =
					found.value._playerStats || found.value._teamStat ? TacticsViewState.Analysis : TacticsViewState.Preparation;
			} else {
				let filtered = this.matchList.filter(({ value }) => moment(value.date).isSameOrAfter(moment())).reverse();
				if (filtered?.length === 0) {
					filtered = this.matchList.filter(({ value }) => moment(value.date).isSameOrBefore(moment()));
				}
				const selected = filtered[0];
				this.handleMatchSelect(selected);
			}
		} else {
			this.handleMatchSelect({ value: this.matchItem });
		}
		this.initOpponentCrests(totalMatches);
	}

	private setMatches(matches: Match[], { offseason, inseasonEnd }: TeamSeason) {
		const totalMatches = matches.filter(({ event }) => event && event.format !== 'clubGame');
		// If I'm seeing an older season, I'll take as reference for date period the end of that season, otherwise I'll take today
		const day = moment().isBetween(offseason, inseasonEnd) ? moment() : moment(inseasonEnd);
		const pastMatches = totalMatches.filter(({ date }) => moment(date).isSameOrBefore(day));
		return { totalMatches, pastMatches };
	}

	private completeMatch(match: Match): Match {
		const activePlayers = this.playerList
			.filter(({ archived }) => this.isActiveAtDate(archived))
			.map(({ id }, index) => this.getTacticalDataForPlayer(id, index));
		if (match._offensive._players?.length === 0) {
			match._offensive._players = activePlayers;
		}
		if (match._defensive._players?.length === 0) {
			match._defensive._players = activePlayers;
		}
		return match;
	}

	private isActiveAtDate(archived: boolean): boolean {
		return !archived || moment(this.match.date).isBefore(moment());
	}

	private getTacticalDataForPlayer(playerId: string, orderingIndex: number) {
		return {
			playerId,
			orderingIndex,
			organization: '',
			transition: ''
		};
	}

	/**
	 * @description Get the suitable colour for each match status
	 * @param value
	 */
	getBackgroundColor(value: Match): { 'background-color': string } {
		if (!value) return null;
		let color: string;
		switch (getResult(value)) {
			case 'win': {
				color = 'green';
				break;
			}
			case 'draw': {
				color = 'yellow';
				break;
			}
			case 'lose': {
				color = 'red';
				break;
			}
		}
		return { 'background-color': moment().isSameOrAfter(moment(value.date)) ? color : 'unset' };
	}

	private initOpponentCrests(matches: Match[]) {
		this.cacheCrests = [];
		const teamNames = matches.map(({ opponent }) => opponent).filter(Boolean);
		const chunks: string[][] = splitArrayInChunks<string>(teamNames, 2);
		this.blockUiInterceptorService
			.disableOnce(this.manageCrestsHttpRequests(chunks, this.loadCrest.bind(this)))
			.pipe(take(chunks.length), untilDestroyed(this))
			// eslint-disable-next-line no-console
			.subscribe({ error: error => console.error(error) });
	}

	// TODO: [IT-3838] abstract managePlayersHttpRequests/manageCrestsHttpRequests() because it will be useful in a lot of scenarios
	private manageCrestsHttpRequests(chunks: string[][], fn: (...args) => Observable<string>, ...args: any[]) {
		return from(chunks).pipe(
			concatMap((chunk: string[]) =>
				chunk.length > 0 ? forkJoin(chunk.map(teamName => fn(teamName, ...args))) : of([])
			)
		);
	}

	private loadCrest(teamName: string) {
		const found = this.getCachedCrest(teamName);
		return found
			? of([found])
			: this.providerIntegrationService.teamSearch(teamName).pipe(
					//TODO find and implement each provider
					first(),
					untilDestroyed(this),
					map((opponentCrests: Team[] = []) => this.addCrestToCache(opponentCrests, teamName))
				);
	}

	private addCrestToCache(opponentCrests: Team[], teamName: string): Team[] {
		if (opponentCrests.length > 0) {
			const crest = opponentCrests.find(({ name }) => name.toLowerCase() === teamName.toLowerCase());
			if (crest) {
				this.cacheCrests.push(crest);
				this.loadOpponentCrestsSuccess(crest);
			}
		}
		return opponentCrests;
	}

	private getCachedCrest(teamName: string) {
		return this.cacheCrests.find(({ name }) => name.toLowerCase() === teamName.toLowerCase());
	}

	private loadOpponentCrestsSuccess(crestTeam: Team) {
		const name = crestTeam.name.toLowerCase();
		this.matches.forEach(match => {
			if (match.opponent.toLowerCase() === name) {
				match.crest = crestTeam.crest;
			}
		});
	}

	private getClosestMatch(matches) {
		const nextGame = matches.filter(({ date }) => moment(date).isSameOrAfter(moment())).reverse();
		const beforeGame = matches.filter(({ date }) => moment(date).isSameOrBefore(moment()));
		if (nextGame.length === 0) {
			if (beforeGame.length === 0) return null;
			else return beforeGame[0];
		} else {
			return nextGame[0];
		}
	}

	private createInjuryMapForPlayer() {
		this.injuryMapPlayer = new Map<string, any>();

		for (const player of this.playerList) {
			let healthStatus = null;
			let available = InjuryAvailability.Ok;
			let expected = null;
			let inj = null;
			for (const injury of player.injuries) {
				if (
					moment(injury.date).isSameOrBefore(moment(this.match.date)) &&
					injury.currentStatus !== 'medical.infirmary.details.statusList.healed'
				) {
					if (injury.issue === 'medical.infirmary.details.issue.injury') {
						healthStatus = 'injury';
						inj = injury;
					} else if (!healthStatus || healthStatus !== 'injury') {
						if (injury.issue === 'medical.infirmary.details.issue.complaint') {
							healthStatus = 'complaint';
							inj = injury;
						} else if (
							!healthStatus ||
							(healthStatus !== 'complaint' && injury.issue === 'medical.infirmary.details.issue.illness')
						) {
							healthStatus = 'illness';
							inj = injury;
						}
					}
					if (isNotEmpty(injury._injuryAssessments)) {
						injury._injuryAssessments = sortByDate(injury._injuryAssessments, 'date').reverse();
						const assessment = injury._injuryAssessments[0];
						if (assessment.available !== 'yes') {
							if (assessment.available === 'careful' && available !== InjuryAvailability.NotAvailable) {
								available = InjuryAvailability.BeCareful;
							} else if (assessment.available === 'no') {
								available = InjuryAvailability.NotAvailable;
								expected = assessment.further === true ? true : assessment.expectation;
							}
						}
					}
				}
				this.injuryMapPlayer.set(player.displayName, {
					healthStatus,
					available,
					expected,
					injury: inj
				});
			}
		}
	}

	private loadMenuItem() {
		this.selectedAnalysis = 0;
		const mappedTactics: SelectItem<string>[] = getTacticsList().map(item => ({
			label: item.name as string,
			value: item.name as string
		}));
		this.tacticsList = sortBy(mappedTactics, 'label');
		this.phaseList = [
			{ label: this.translate.instant('tactics.phase.offensive'), value: '_offensive' },
			{ label: this.translate.instant('tactics.phase.defensive'), value: '_defensive' }
		];
	}

	handleChangeTab({ index }) {
		if (this.currentViewState === TacticsViewState.Preparation && index === 1) {
			this.matchList = this.pastMatches.map(match => ({
				label: match.opponent + ' - ' + moment(match.date).format(getMomentFormatFromStorage()),
				value: match
			}));
			if (this.matchList.length > 0 && !this.matchList.find(({ value }) => value.id === this.match.id))
				this.handleMatchSelect(this.matchList[0]);
			if (!this.teamStat) {
				this.notificationService.notify('error', 'tactics', 'alert.noTeamStatsFound', false);
				if (this.playerStats?.length === 0) {
					this.notificationService.notify('error', 'tactics', 'alert.noPlayerStatsFound', false);
				}
			}
		} else {
			this.matchList = this.matches.map(match => ({
				label: match.opponent + ' - ' + moment(match.date).format(getMomentFormatFromStorage()),
				value: match
			}));
		}

		this.currentViewState = index;
	}

	// TODO use server readiness logic
	private getGoScoresForMatch(match: Match) {
		const playerIds = this.selectedPhase._players
			.filter(({ playerId }) => playerId && playerId !== '-')
			.map(({ playerId }) => playerId);
		const date = moment(match?.date).isAfter(moment()) ? moment().toDate() : match?.date;
		this.goScoreApi
			.find({
				where: {
					playerId: { inq: playerIds },
					and: [
						{
							date: {
								gte: moment(date).startOf('day').subtract(2, 'day').toDate()
							}
						},
						{
							date: {
								lte: moment(date).endOf('day').toDate()
							}
						}
					]
				}
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (scores: GOScore[]) => {
					this.playerList = [
						...this.playerList.map(player => ({
							...player,
							goScores: sortByDateDesc(
								scores.filter(({ playerId }) => playerId === player.id),
								'date'
							)
						}))
					];
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	handleMatchSelect({ value }: SelectItem) {
		this.match = this.completeMatch(value);
		this.matchItem = this.match;
		this.phaseItem = this.phaseList[0].value;
		this.openedPhase = this.phaseList[0].value;
		this.selectedPhase = this.match._offensive;
		this.loadVideoLength();

		this.getGoScoresForMatch(this.match);

		if (!this.matchItem.event.subformatDetails) {
			this.matchItem.event.subformatDetails = this.loadSubformDetails(this.matchItem.event.subformat);
		}

		this.teamStat = this.match._teamStat;
		this.playerStats = sortByName(this.match._playerStats, 'playerName').map(stat => {
			const player = this.playerList.find(({ id }) => id === stat.playerId);
			if (player) stat.playerName = player.displayName;
			return stat;
		});

		this.loadPlayerStats();
		this.createInjuryMapForPlayer();

		if (isNotEmpty(this.playerStatList)) {
			if (!this.selectedPlayerStat) this.selectedPlayerStat = this.playerStatList[0].value;
			else {
				this.selectedPlayerStat = (
					this.playerStatList.find(({ value: { playerId } }) => playerId === this.selectedPlayerStat.playerId) ||
					this.playerStatList[0]
				).value;
			}
			this.handlePlayerSelect({ value: this.selectedPlayerStat });

			if (!this.selectedPlayerStatComparison?.length) this.selectedPlayerStatComparison = this.playerStats;
			else
				this.selectedPlayerStatComparison = this.playerStats.filter(value =>
					this.selectedPlayerStatComparison.map(({ playerId }) => playerId).includes(value.playerId)
				);
			this.handleChangeComparisonPlayer({ value: this.selectedPlayerStatComparison });
		}

		if (!this.selectedMetricPlayer?.length) this.selectedMetricPlayer = [this.metricsIndividualOptions[0].value];
		if (!this.selectedMetricTeam?.length) this.selectedMetricTeam = [this.metricsTeamOptions[0].value];

		let offensiveOrderingIndex = 0;
		this.match?._offensive?._players.forEach(data => {
			data.orderingIndex = offensiveOrderingIndex;
			offensiveOrderingIndex = offensiveOrderingIndex + 1;
		});
		let defensiveOrderingIndex = 0;
		this.match?._defensive?._players.forEach(data => {
			data.orderingIndex = defensiveOrderingIndex;
			defensiveOrderingIndex = defensiveOrderingIndex + 1;
		});

		this.handlePhaseSelect(
			this.phaseItem ? this.phaseList.find(({ value: item }) => item === this.phaseItem) : this.phaseList[0]
		);
		if (this.currentViewState === TacticsViewState.Analysis) {
			if (!this.teamStat) {
				this.notificationService.notify('warn', 'tactics', 'alert.noTeamStatsFound', false);
				if (!this.playerStats || this.playerStats.length === 0) {
					this.notificationService.notify('warn', 'tactics', 'alert.noPlayerStatsFound', false);
				}
			}
		}
	}

	private loadSubformDetails(subformat: any) {
		let competition;
		if (!isNaN(subformat)) {
			competition = this.competitionService.getCompetitionFromJson(subformat);
		}
		return competition ? competition.name : this.translate.instant(subformat);
	}

	handlePhaseSelect({ value }) {
		this.phaseItem = value;
		this.openedPhase = this.phaseList.find(x => x.value === value).value;
		this.selectedPhase = this.match[value];
	}

	handleTacticSelect(e) {
		this.isSavingSelectedTactics = true;
		this.requestSaveTactics()
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.isSavingSelectedTactics = false;
					this.notificationService.notify('success', 'tactics', 'alert.matchUpdated', false);
				},
				error: (error: Error) => {
					this.isSavingSelectedTactics = false;
					this.error.handleError(error);
				}
			});
	}

	handleChangeAnalysis({ value }) {
		this.loadPlayerStats();
		if (value === 'comparison') {
			if (!this.selectedPlayerStatComparison?.length) this.selectedPlayerStatComparison = this.playerStatListComparison;
			this.handleChangeComparisonPlayer({ value: this.selectedPlayerStatComparison });
		} else {
			if (this.selectedPlayerStat) {
				this.selectedPlayerStat = this.playerStatList.find(
					({ value }) => value.playerId === this.selectedPlayerStat.playerId
				).value;
			} else {
				this.selectedPlayerStat = this.playerStatList[0].value;
			}
			this.handlePlayerSelect({ value: this.selectedPlayerStat });
		}
	}

	handlePlayerSelect({ value }) {
		this.currentThresholds = [];
		if (value === 'TEAM') {
			this.playerView = false;
			this.currentThresholds = this.currentTeam._thresholdsTeam;
		} else {
			this.playerView = true;
			this.selectedPlayerStat = value;
			const playerConnected: Player = this.playerList.find(({ id }) => id === this.selectedPlayerStat.playerId);
			this.currentThresholds =
				playerConnected?._thresholdsPlayer ||
				this.metricsPlayer.map(
					({ metricName, defaultValue }) =>
						new Threshold({
							name: metricName,
							value: defaultValue
						})
				);
		}
	}

	handleChangeComparisonPlayer({ value }) {
		this.comparisonThresholdsMap = new Map<string, any[]>();
		this.selectedPlayerStatComparison = value;
		this.selectedPlayerStatComparison.forEach(selected => {
			if (isGroup(selected)) {
				this.comparisonThresholdsMap.set(selected.name, this.etlPlayerService.getDefaultThresholds());
			} else {
				const player = this.playerList.find(({ id }) => id === selected.playerId);
				if (player) {
					this.comparisonThresholdsMap.set(player.displayName, player._thresholdsPlayer);
				}
			}
		});
	}

	private loadPlayerStats() {
		if (this.selectedType === 'summary') {
			this.playerStatList = this.playerStats.map(stat => ({ label: stat.playerName, value: stat }));
			if (this.match._teamStat) {
				this.playerStatList = [{ label: 'TEAM', value: 'TEAM' }, ...this.playerStatList];
			}
		} else {
			this.playerStatListComparison = [
				...this.currentTeam.teamGroups.map(group => ({ label: group.name, value: group })),
				...this.playerStats.map(plStat => ({ label: plStat.playerName, value: plStat }))
			];
		}
	}

	onSaveEmitted($event) {
		this.saveTactics();
	}

	private saveTactics() {
		this.requestSaveTactics()
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private requestSaveTactics() {
		this.match[this.phaseItem] = this.selectedPhase;
		const teamStats = copyValue(this.match._teamStat);
		const playerStats = this.match._playerStats.map(x => copyValue(x));
		const match = this.checkForMatchPlayersWrong(this.match);
		return this.matchApi.updateAttributes(match.id, match).pipe(
			map((updatedMatch: Match) => {
				this.match = { ...this.match, ...updatedMatch };
				this.match._teamStat = copyValue(teamStats);
				this.match._playerStats = playerStats.map(x => copyValue(x));
				this.selectedPhase = updatedMatch[this.phaseItem];
				this.selectedPhase.tactic = updatedMatch[this.phaseItem].tactic;
				return this.match;
			})
		);
	}

	private checkForMatchPlayersWrong(m: Match): Match {
		for (const i in m._offensive._players) {
			if (Object.prototype.hasOwnProperty.call(m._offensive._players, i)) {
				m._offensive._players[i].orderingIndex = i;
			}
		}
		for (const j in m._defensive._players) {
			if (Object.prototype.hasOwnProperty.call(m._defensive._players, j)) {
				m._defensive._players[j].orderingIndex = j;
			}
		}
		return m;
	}

	handleChangeMetricTeam(event) {
		event.originalEvent.originalEvent.preventDefault();
		if (this.selectedMetricTeam.length === 0) {
			this.notificationService.notify('error', 'matchAnalysis', 'alert.metricsRequired', false);
		} else {
			const maxMetrics = 2;
			if (this.selectedMetricTeam.length > maxMetrics) {
				this.selectedMetricTeam = this.selectedMetricTeam.slice(0, maxMetrics);
			}
			const tempMetrics = [];
			for (const m1 of this.selectedMetricTeam) {
				tempMetrics.push(m1);
				this.selectedMetricTeam = tempMetrics;
			}
		}
	}

	handleChangeMetricPlayer(event) {
		event.originalEvent.originalEvent.preventDefault();
		if (this.selectedMetricPlayer.length === 0) {
			this.notificationService.notify('error', 'matchAnalysis', 'alert.metricsRequired', false);
		} else {
			const maxMetrics = 2;
			if (this.selectedMetricPlayer.length > maxMetrics) {
				this.selectedMetricPlayer = this.selectedMetricPlayer.slice(0, maxMetrics);
			}
			const tempMetrics = [];
			for (const m1 of this.selectedMetricPlayer) {
				tempMetrics.push(m1);
				this.selectedMetricPlayer = tempMetrics;
			}
		}
	}

	loadVideoLength() {
		this.videos$ = this.videoMatchesService.load([VideoCategory.GAMES]);
		this.videoSubscription = this.videos$.subscribe((videos: VideoAsset[]) => {
			if (videos) {
				this.videosLength = this.matchItem
					? videos.filter(({ linkedId }) => linkedId === this.matchItem?.eventId).length
					: videos.length;
			}
		});
	}
	private listenToUploadSuccess() {
		this.videoService
			.listenReload()
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.reloadVideos();
				}
			});
	}

	reloadVideos() {
		if (this.videos$) {
			this.videoMatches$ = this.videos$.pipe(
				map((videos: VideoAsset[]) =>
					this.matchItem ? videos.filter(({ linkedId }) => linkedId === this.matchItem.eventId) : videos
				)
			);
			this.videoMatches$.pipe(first(), untilDestroyed(this)).subscribe({
				next: () => {
					this.display = true;
					this.sidebarOpen = false;
				},
				error: (error: Error) => this.error.handleError(error)
			});
		}
	}

	closeVideoGallery() {
		this.display = false;
		this.sidebarOpen = true;
	}

	showDialogPlayer(playerData: TacticsPlayerData) {
		this.dialogPlayer = playerData;
		this.openedPlayer = this.playerList.find(({ id }) => id === playerData.playerId);
		this.openedPhase = this.phaseList.find(({ value }) => value === this.phaseItem).value;
		this.tempPlayer = copyValue(this.dialogPlayer);
		this.displayPlayerDialog = true;
	}

	savePlayerDetails(playerData: TacticsPlayerData) {
		const index = this.selectedPhase._players.findIndex(({ id }) => id === playerData.id);
		if (index > -1) {
			this.selectedPhase._players[index] = playerData;
			this.saveTactics();
		}
	}

	setSidebar(e) {
		this.sidebarOpen = e;
	}

	getMatchReport() {
		const t = this.translate.instant.bind(this.translate);
		const phase = this.phaseList.find(({ value }) => value === this.phaseItem).label;
		const matchStatus = getResult(this.matchItem);
		const data = {
			title: t('sidebar.preparation'),
			date: {
				value: moment(this.matchItem.date).format(getMomentFormatFromStorage()),
				label: t('sidebar.date')
			},
			home: {
				value: this.matchItem.home ? t('sidebar.homeValue') : t('sidebar.awayValue'),
				label: t('sidebar.home')
			},
			team: { value: this.currentTeam.name, label: t('Team') },
			opponent: {
				value: this.matchItem.opponent,
				label: t('sidebar.opponent')
			},
			result: {
				value: this.matchItem.result || '-',
				label: t('sidebar.result')
			},
			matchStatus: {
				value: matchStatus ? t(matchStatus) : '-',
				label: t('event.matchStatus')
			},
			tactic: {
				value: this.selectedPhase.tactic,
				label: t('sidebar.yourTactic')
			},
			phase: { value: phase, label: t('sidebar.phase') },
			transition: {
				value: this.selectedPhase.transition,
				comments: this.selectedPhase.transitionComments,
				label: t('tactics.phase.transition')
			},
			organization: {
				value: this.selectedPhase.organization,
				comments: this.selectedPhase.organizationComments,
				label: t('tactics.phase.organization')
			},
			setPieces: {
				value: this.selectedPhase.setPieces,
				comments: this.selectedPhase.setPiecesComments,
				label: t('tactics.phase.setPieces')
			}
		};
		return data;
	}

	onCloseDetails() {
		this.display = false;
		this.displayPlayerDialog = false;
	}

	getCompetition(value: string): string {
		return this.competitionService.getCompetitionName(value, this.selectedSeason);
	}

	saveAttachments() {
		this.eventApi
			.patchAttributes(this.match.event.id, { id: this.match.event.id, _attachments: this.match.event._attachments })
			.pipe(untilDestroyed(this))
			.subscribe(
				(res: any) => {
					this.notificationService.notify('success', 'tactics', 'alert.recordUpdated', false);
				},
				(error: Error) => {
					this.error.handleError(error);
				}
			);
	}
}
