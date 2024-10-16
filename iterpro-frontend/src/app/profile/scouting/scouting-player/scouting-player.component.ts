import {
	Component,
	EventEmitter,
	Injector,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges
} from '@angular/core';
import { AuthSelectors, CurrentTeamService, SelectableTeam } from '@iterpro/shared/data-access/auth';
import {
	AdditionalFieldEntry,
	AttributesTable,
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	MixedAttributeCategory,
	MixedType,
	Player,
	PlayerAttributesEntry,
	PlayerDescriptionEntry,
	PlayerReportEntriesEmitter,
	PlayerScouting,
	ReportDataAvg,
	ReportDataColumn,
	ScoutingGame,
	ScoutingGameInit,
	ScoutingGameWithReport,
	ScoutingLineup,
	ScoutingPlayerEntireProfileReportModel,
	ScoutingPlayerGamesTableRow,
	ScoutingSettings,
	Team,
	TeamSeason,
	attributeCategories,
	PotentialLetter
} from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	ErrorService,
	ProviderIntegrationService,
	ReportService,
	SportType,
	clearAndCopyCircularJSON,
	completeWithAdditionalFields,
	getAvgValueForSpinner,
	getBasicDevelopmentChartData,
	getCategoryValues,
	getCircles,
	getColorClass,
	getCorrectTextColorUtil,
	getId,
	getLetterColorClass,
	getLiteralAvg,
	getNumericalAvg,
	getPlayerAttributesEntryValue,
	getPotentialScore,
	getPreferredMovesSelectItems,
	getSpinnerColor,
	swissPerformanceCalculatedByWhitelist,
	swissPlayerAttributesWhitelist,
	swissPotentialCalculatedByWhitelist,
	getTeamSettings,
	userHasPermission,
	getUniqueReportDataColumns,
	getTeamsPlayerAttributes,
	isBase64Image,
	getIconForBooleanType,
	getStyleFromReportRowType,
	getIconColorForBooleanType,
	getModeFromReportRowType
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'lodash';
import moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import {
	ScoutingGameActions,
	ScoutingGameSelectors,
	ScoutingGameState
} from './../../../+state/scouting-player-games-store';
import {
	Action,
	PlayerScoutingInfo,
	ScoutingGamesRecap
} from './../../../+state/scouting-player-games-store/interfaces/scouting-player-games-store.interfaces';
interface ChangeTabEvent {
	index: number;
	originalEvent?: MouseEvent;
}

export interface SaveScoutingPlayerEmitter {
	player: PlayerScouting;
	askForConfirmation?: boolean;
}

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-player',
	templateUrl: './scouting-player.component.html',
	styleUrls: ['./scouting-player.component.css']
})
export class ScoutingPlayerComponent extends EtlBaseInjectable implements OnChanges, OnInit, OnDestroy {
	@Input() player: ExtendedPlayerScouting;
	@Input() selectedTabIndex: number;
	@Input() scoutingPlayers: PlayerScouting[];
	@Input() editMode: boolean;
	@Input() discarded: boolean;
	@Input() seasons: TeamSeason[];
	@Input() scenarioRoles: boolean;
	@Input() clubPlayers: Player[];
	@Input() customers: Customer[];
	@Input() scenarios: ScoutingLineup[];
	@Input() sportType: SportType;

	@Output() onSavePlayer: EventEmitter<SaveScoutingPlayerEmitter> = new EventEmitter<SaveScoutingPlayerEmitter>();
	@Output() tabChangeEmitter: EventEmitter<ChangeTabEvent> = new EventEmitter<ChangeTabEvent>();
	@Output() scenariosEmitter: EventEmitter<ScoutingLineup> = new EventEmitter<ScoutingLineup>();
	@Output() swapEmitter: EventEmitter<ChangeTabEvent> = new EventEmitter<ChangeTabEvent>();
	@Output() selectedGameEmitter: EventEmitter<ScoutingGameInit> = new EventEmitter<ScoutingGameInit>();
	@Output() playerReportEmitter: EventEmitter<PlayerReportEntriesEmitter> =
		new EventEmitter<PlayerReportEntriesEmitter>();

	teamList$: Observable<SelectItem[]>;
	games$: Observable<ScoutingGameWithReport[]>;
	scoutingPlayerGamesRecap$: Observable<ScoutingGamesRecap>;
	scoutingPlayerGamesTable$: Observable<ScoutingPlayerGamesTableRow[]>;
	isSwiss$: Observable<boolean>;

	hasPermissionScoutingGames: boolean;
	tabIndex = 0; // preload tab 0 and 1 (overview and attributes/reports)
	activeIndexTab = 0;
	profileUrl: string;

	constructor(
		private currentTeamService: CurrentTeamService,
		private auth: LoopBackAuth,
		private translate: TranslateService,
		private azureUrlPipe: AzureStoragePipe,
		private store$: Store<ScoutingGameState.State>,
		private reportService: ReportService,
		private error: ErrorService,
		private providerIntegrationService: ProviderIntegrationService,
		injector: Injector
	) {
		super(injector);
		const { teamSettings, currentTeamId } = this.auth.getCurrentUserData();
		this.hasPermissionScoutingGames = userHasPermission(
			getTeamSettings(teamSettings, currentTeamId),
			'scouting-games-report'
		);
	}

	ngOnInit() {
		this.teamList$ = this.store$
			.select(AuthSelectors.selectTeamList)
			.pipe(map((teams: SelectableTeam[]) => teams.map(({ id, name }) => ({ value: id, label: name }))));
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			if (this.player) {
				this.handlePlayerLoaded();
				this.profileUrl = this.getImageUrl(this.player?.downloadUrl);
			}
		}
	}
	private handlePlayerLoaded() {
		const { club } = this.currentTeamService.getCurrentTeam();
		const settings: ScoutingSettings = club.scoutingSettings;
		const { observerTeams, teamId } = this.player;
		const playerInfo: PlayerScoutingInfo = { id: getId(this.player), observerTeams, teamId };
		this.store$.dispatch(
			ScoutingGameActions.initScoutingGames({
				playerInfo,
				settings,
				customers: this.customers
			})
		);

		this.isSwiss$ = this.store$.select(ScoutingGameSelectors.selectIsSwiss);

		this.games$ = this.store$.select(ScoutingGameSelectors.selectAllPlayerGamesStore);
		this.scoutingPlayerGamesRecap$ = this.store$.select(ScoutingGameSelectors.selectGamesRecap);
		this.scoutingPlayerGamesTable$ = this.store$.select(ScoutingGameSelectors.selectScoutingPlayerGamesTable);
		if (this.selectedTabIndex) {
			this.onTabChange({ index: this.selectedTabIndex });
		}
	}

	ngOnDestroy() {
		this.store$.dispatch(ScoutingGameActions.clearScoutingGames());
	}

	selectGame(game: ScoutingGameInit) {
		this.selectedGameEmitter.emit(game);
	}

	onScoutingGameAction({ target, action }: Action) {
		switch (action) {
			case 'add':
				this.store$.dispatch(
					ScoutingGameActions.addScoutingGame({
						scoutingGame: target as ScoutingGameWithReport
					})
				);
				break;
			case 'edit':
				this.store$.dispatch(
					ScoutingGameActions.upsertScoutingGame({
						scoutingGame: target as ScoutingGameWithReport
					})
				);
				break;
			case 'deleteScoutingGame':
				this.store$.dispatch(
					ScoutingGameActions.performDeleteScoutingGames({
						scoutingGames: target as ScoutingGame[]
					})
				);
				break;
			case 'deleteGameReports':
				this.store$.dispatch(
					ScoutingGameActions.performDeleteScoutingGameReports({
						// @ts-ignore
						gameWithReports: target
					})
				);
				break;
		}
	}

	savePlayer(player: PlayerScouting, askForConfirmation = true) {
		this.player = player;
		this.onSavePlayer.emit({ player: player, askForConfirmation: askForConfirmation });
	}

	saveOtherPlayer(player: PlayerScouting) {
		this.onSavePlayer.emit({ player });
	}

	onTabChange(event: ChangeTabEvent) {
		this.tabIndex = event.index;
		this.tabChangeEmitter.emit(event);
	}

	onScenariosUpdate(scenario: ScoutingLineup) {
		this.scenariosEmitter.emit(scenario);
	}

	redirectTo(originalEvent: MouseEvent) {
		if (this.tabIndex !== 3) {
			this.tabIndex = 3;
			this.onTabChange({ originalEvent, index: 3 });
		}
	}
	private getImageUrl(img: string): string {
		return img && isBase64Image(img) ? img : this.azureUrlPipe.transform(img);
	}

	private getAttributesEntry(player: PlayerScouting, team: Team): PlayerAttributesEntry {
		return completeWithAdditionalFields(
			last(player?.attributes || []),
			getTeamsPlayerAttributes([team]),
			'PlayerScouting',
			team?.club?.scoutingSettings
		);
	}

	private getAttributesEntries(player: PlayerScouting, team: Team): PlayerAttributesEntry[] {
		return (this.player?.attributes || []).map(item =>
			completeWithAdditionalFields(
				item,
				getTeamsPlayerAttributes([team]),
				'PlayerScouting',
				team?.club?.scoutingSettings
			)
		);
	}
	//#region PDF Report
	downloadProfilePdf() {
		this.scoutingPlayerGamesTable$.pipe(first()).subscribe({
			next: (tableGames: ScoutingPlayerGamesTableRow[]) => {
				let scoutingTeamName: string;
				this.getTeamName(this.player.teamId).subscribe((result: string) => {
					scoutingTeamName = result;
				});
				const reportDataColumns: ReportDataColumn[] = getUniqueReportDataColumns(
					tableGames.map(({ game }) => game?.reportData)
				);
				if (this.player[this.etlPlayerService.getProviderIdField()]) {
					this.providerIntegrationService
						.getPlayerCareerTransfers(this.player)
						.pipe(first(), untilDestroyed(this))
						.subscribe({
							next: ({ transfers, career }) => {
								const clubCareer = this.careerOfType('club', career);
								const data = this.generateReport(clubCareer, reportDataColumns, scoutingTeamName, tableGames);
								const fileName = `Scouting Report - ${this.player.displayName}.pdf`;
								this.reportService.getReport('player_scouting_entire_profile', data, undefined, null, fileName, true);
							},
							error: (error: Error) => this.error.handleError(error)
						});
				}
			}
		});
	}
	private careerOfType(type: 'club' | 'international', career: any[]) {
		return career && career.length > 0
			? career.filter(({ competition }) => !!competition && competition.type.toString() === type).reverse()
			: [];
	}

	private getCareerRows(career): MixedType[] {
		const result: MixedType[] = [];
		result.push({ label: career.season?.name, mode: 'text' });
		result.push({ label: career.competition?.name, mode: 'text' });
		result.push({ label: career.team?.officialName, mode: 'text' });
		result.push({ label: career.shirtNumber, mode: 'text', alignment: 'center' });
		result.push({ label: career.appearances, mode: 'text', alignment: 'center' });
		result.push({ label: career.goal, mode: 'text', alignment: 'center' });
		result.push({ label: career.penalties, mode: 'text', alignment: 'center' });
		result.push({ label: career.minutesPlayed, mode: 'text', alignment: 'center' });
		result.push({ label: career.substituteIn, mode: 'text', alignment: 'center' });
		result.push({ label: career.substituteOut, mode: 'text', alignment: 'center' });
		result.push({ label: career.yellowCard, mode: 'text', alignment: 'center' });
		result.push({ label: career.redCards, mode: 'text', alignment: 'center' });
		return result;
	}

	private getGameReportRows(
		gameReport: ScoutingPlayerGamesTableRow,
		reportDataColumns: ReportDataColumn[]
	): MixedType[] {
		const result: MixedType[] = [
			{ label: moment(gameReport?.start).format('DD/MM/YYYY'), mode: 'text' },
			{ label: gameReport?.opponent, mode: 'text' },
			{ label: gameReport?.level ? this.translate.instant(gameReport?.level) : '', mode: 'text' },
			{ label: gameReport?.assignedTo, mode: 'text' }
		];
		if (reportDataColumns && reportDataColumns.length > 0) {
			for (const column of reportDataColumns) {
				const item: ReportDataColumn = gameReport[column.key];
				if (item) {
					result.push({
						label: column.type === 'booleanType' ? getIconForBooleanType(item.value) : item.value || '-',
						mode: item.value ? getModeFromReportRowType(column.type) : 'text',
						cssStyle: item.value ? getStyleFromReportRowType(column.type, item.value, item.color) : undefined,
						alignment: 'center'
					});
				}
			}
		}
		return result;
	}

	private getGameReportTableHeaders(reportDataColumns: ReportDataColumn[]): MixedType[] {
		const gameReportsHeaders: MixedType[] = [
			{ label: this.translate.instant('date'), mode: 'text' },
			{ label: this.translate.instant('event.opponent'), mode: 'text' },
			{ label: this.translate.instant('scouting.game.level'), mode: 'text' },
			{ label: this.translate.instant('scouting.assignedTo'), mode: 'text' }
		];
		for (const column of reportDataColumns) {
			gameReportsHeaders.push({
				label: this.translate.instant(column.label),
				mode: 'text',
				alignment: 'center'
			});
		}
		return gameReportsHeaders;
	}

	private generateReport(
		clubCareer,
		reportDataColumns: ReportDataColumn[],
		scoutingTeamName: string,
		tableGames: ScoutingPlayerGamesTableRow[]
	): ScoutingPlayerEntireProfileReportModel {
		const preferredMovesSelectItems = getPreferredMovesSelectItems(this);
		let result: ScoutingPlayerEntireProfileReportModel;
		const currentTeam: Team = this.currentTeamService.getCurrentTeam();
		const scoutingSettings = currentTeam && currentTeam.club.scoutingSettings;
		const isActiveAttributesDescriptionSettings =
			scoutingSettings && scoutingSettings.playerDescription === 'attributes';
		const playerDescriptionsEntry: PlayerDescriptionEntry = last(this.player.descriptions || []);
		const selectedAttributeEntry: PlayerAttributesEntry = this.getAttributesEntry(this.player, currentTeam);
		const playerAttributeEntries: PlayerAttributesEntry[] = this.getAttributesEntries(this.player, currentTeam);
		const chartResult = getBasicDevelopmentChartData(
			playerAttributeEntries,
			isActiveAttributesDescriptionSettings,
			scoutingSettings,
			this.translate
		);
		chartResult.options.plugins.legend = {
			...chartResult.options.plugins.legend,
			position: 'bottom',
			labels: {
				boxWidth: 20
			}
		};
		if (currentTeam) {
			result = {
				currentTeamHeader: {
					team: { value: currentTeam.name },
					logo: this.getImageUrl(currentTeam.club.crest),
					player: this.player.displayName,
					playerImg: this.getImageUrl(this.player?.downloadUrl)
				},
				headers: {
					general: this.translate.instant('general'),
					deal: this.translate.instant('deal'),
					attributes: this.translate.instant('profile.tabs.attributes'),
					playerReport: 'Player Reports',
					preferredMoves: this.translate.instant('profile.position.preferredMoves'),
					description: this.translate.instant('Description'),
					strenghts: this.translate.instant('scouting.strenghts'),
					weaknesses: this.translate.instant('scouting.weakness'),
					development: this.translate.instant('development'),
					career: this.translate.instant('squads.players.tabs.career')
				},
				general: {
					items: [
						{
							label: this.translate.instant('profile.overview.name'),
							value: this.player.name
						},
						{
							label: this.translate.instant('profile.overview.surname'),
							value: this.player.lastName
						},
						{
							label: this.translate.instant('profile.overview.displayName'),
							value: this.player.displayName
						},
						{
							label: this.translate.instant('profile.contact.email'),
							value: this.player.email
						},
						{
							label: this.translate.instant('profile.contact.phone'),
							value: this.player.phone
						},
						{
							label: this.translate.instant('profile.overview.birth'),
							value: moment(this.player.birthDate).format('DD/MM/YYYY')
						},
						{
							label: this.translate.instant('profile.overview.nationality'),
							value: this.player.nationality
						},
						{
							label: this.translate.instant('profile.overview.altNationality'),
							value: this.player.altNationality
						},
						{
							label: this.translate.instant('profile.overview.passport'),
							value: this.player.passport
						},
						{
							label: this.translate.instant('profile.overview.altPassport'),
							value: this.player.altPassport
						},
						{
							label: this.translate.instant('admin.contracts.origin'),
							value: this.player.nationalityOrigin
						},
						{
							label: this.translate.instant('scouting.league'),
							value: this.player.currentLeague
						},
						{
							label: this.translate.instant('scouting.league'),
							value: this.player.name
						},
						{
							label: this.translate.instant('financial.overview.contractExpiry'),
							value: moment(this.player.contractEnd).format('DD/MM/YYYY')
						},
						{
							label: this.translate.instant('profile.overview.agent'),
							value: this.player.agent
						},
						{
							label: this.translate.instant('profile.overview.agentEmail'),
							value: this.player.agentEmail
						},
						{
							label: this.translate.instant('profile.overview.agentPhone'),
							value: this.player.agentPhone
						},
						{
							label: this.translate.instant('Scouting Team'),
							value: scoutingTeamName
						}
					]
				},
				deal: {
					items: [
						{
							label: this.translate.instant('profile.overview.transferfee'),
							value:
								(this.player.feeFrom ? this.player.feeFrom : '') + ' - ' + (this.player.feeTo ? this.player.feeTo : '')
						},
						{
							label: this.translate.instant('profile.overview.transferwage'),
							value:
								(this.player.wageFrom ? this.player.wageFrom : '') +
								' - ' +
								(this.player.wageTo ? this.player.wageTo : '')
						}
					]
				},
				attributes: {
					items: [
						{
							label: this.translate.instant('profile.overview.weight'),
							value: String(this.player.weight)
						},
						{
							label: this.translate.instant('profile.overview.height'),
							value: String(this.player.height)
						},
						{
							label: this.translate.instant('profile.position.foot'),
							value: this.translate.instant(this.player?.foot || '-')
						}
					]
				},
				preferredMoves: {
					items: [
						{
							label: this.translate.instant('profile.position.preferredMoves.movementOnBall'),
							value: (this.player.movOnBall || [])
								.map(value => preferredMovesSelectItems.movOnBall.find(item => value === item.value).label)
								.join(', ')
						},
						{
							label: this.translate.instant('profile.position.preferredMoves.passing'),
							value: (this.player.passing || [])
								.map(value => preferredMovesSelectItems.passing.find(item => value === item.value).label)
								.join(', ')
						},
						{
							label: this.translate.instant('profile.position.preferredMoves.finishing'),
							value: (this.player.finishing || [])
								.map(value => preferredMovesSelectItems.finishing.find(item => value === item.value).label)
								.join(', ')
						},
						{
							label: this.translate.instant('profile.position.preferredMoves.defending'),
							value: (this.player.defending || [])
								.map(value => preferredMovesSelectItems.defending.find(item => value === item.value).label)
								.join(', ')
						},
						{
							label: this.translate.instant('profile.position.preferredMoves.technique'),
							value: (this.player.technique || [])
								.map(value => preferredMovesSelectItems.technique.find(item => value === item.value).label)
								.join(', ')
						}
					]
				},
				careerTable: {
					headers: [
						{
							label: this.translate.instant('admin.evaluation.season'),
							mode: 'text'
						},
						{
							label: this.translate.instant('scouting.league'),
							mode: 'text'
						},
						{
							label: this.translate.instant('admin.evaluation.club'),
							mode: 'text'
						},
						{
							label: this.translate.instant('admin.evaluation.jersey'),
							mode: 'fa-icon',
							value: 'fas fa-tshirt',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.apps'),
							mode: 'text',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.goals'),
							mode: 'fa-icon',
							value: 'fas fa-futbol',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.penalties'),
							mode: 'fa-icon',
							value: 'fas fa-whistle',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.minutesPlayed'),
							mode: 'fa-icon',
							value: 'fas fa-clock',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.substituteIn'),
							mode: 'fa-icon',
							value: 'fas fa-arrow-up',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.substituteOut'),
							mode: 'fa-icon',
							value: 'fas fa-arrow-down',
							alignment: 'center'
						},
						{
							label: this.translate.instant('admin.evaluation.yellowCards'),
							mode: 'div',
							cssClass: 'soccer-card yellow',
							alignment: 'center'
						},
						{
							label: this.translate.instant('Red Cards'),
							mode: 'div',
							cssClass: 'soccer-card red',
							alignment: 'center'
						}
					],
					rows: clubCareer.map(a => this.getCareerRows(a))
				},
				attributesTable: isActiveAttributesDescriptionSettings
					? this.getBasicAttributesTable(selectedAttributeEntry, scoutingSettings)
					: this.getSwissAttributesTable(selectedAttributeEntry),
				description: playerDescriptionsEntry?.description,
				strenghts: playerDescriptionsEntry?.strengths,
				weaknesses: playerDescriptionsEntry?.weaknesses,
				position: getCircles(
					undefined,
					this.player.position,
					this.player.position2,
					this.player.position3,
					this.sportType
				),
				chart: {
					data: clearAndCopyCircularJSON(chartResult.data),
					options: chartResult.options
				},
				gameReportsTable: {
					headers: this.getGameReportTableHeaders(reportDataColumns),
					rows: tableGames.map((game: ScoutingPlayerGamesTableRow) => this.getGameReportRows(game, reportDataColumns))
				}
			};
			return result;
		}
	}

	private getSwissAttributesTable(selectedAttributeEntry: PlayerAttributesEntry): AttributesTable[] {
		const result: AttributesTable[] = this.player.reportDataAvg
			.filter(({ key }) => swissPlayerAttributesWhitelist.includes(key))
			.map((item: ReportDataAvg) => {
				const whiteList =
					item.sectionId === 'performance'
						? swissPerformanceCalculatedByWhitelist
						: swissPotentialCalculatedByWhitelist;
				const calculatedBy = this.player.reportDataAvg.filter(({ sectionId, key }) =>
					whiteList.includes(sectionId + key)
				);
				const currentForSvg = typeof item.avg === 'string' ? getPotentialScore(item.avg as PotentialLetter) : item.avg;
				const maxSvg = typeof item.avg === 'string' ? 3 : item.max;
				return {
					header: item.label,
					value: item.avg,
					color: item.color,
					dForSvg: this.getDforSvg(currentForSvg, maxSvg),
					items: calculatedBy.map(field => ({
						label: field.label,
						value: typeof field.avg !== 'boolean' ? field.avg : getIconForBooleanType(field.avg),
						mode: typeof field.avg !== 'boolean' ? 'text' : 'fa-icon',
						cssStyle:
							typeof field.avg !== 'boolean'
								? `background-color: ${field.color}; color: ${getCorrectTextColorUtil(
										field.color
									)}; padding-left: 6px; padding-right: 6px; width: 15px; text-align:center`
								: `color: ${getIconColorForBooleanType(field.avg)}; padding-left: 6px; padding-right: 6px;`
					}))
				};
			});
		const prognosisScore = getPlayerAttributesEntryValue(selectedAttributeEntry, 'prognosisScore');
		const prognosisDescription = getPlayerAttributesEntryValue(selectedAttributeEntry, 'prognosisDescription');
		const prognosisColor = getLetterColorClass(
			String(getPlayerAttributesEntryValue(selectedAttributeEntry, 'prognosisScore')) as PotentialLetter
		);
		result.push({
			header: this.translate.instant('prognosis'),
			value: prognosisScore || '',
			color: prognosisColor,
			dForSvg: this.getDforSvg(prognosisScore, 3),
			items: [
				{
					label: '',
					value: prognosisDescription ? String(prognosisDescription) : '-',
					mode: 'textarea',
					alignment: 'left'
				}
			]
		});
		return result;
	}

	private getBasicAttributesTable(
		selectedAttributeEntry: PlayerAttributesEntry,
		scoutingSettings: ScoutingSettings
	): AttributesTable[] {
		return attributeCategories.map(category => ({
			header: this.translate.instant(category.title),
			value: this.getAvgValue(selectedAttributeEntry, category.category, 1, scoutingSettings),
			color: getSpinnerColor(true, getCategoryValues(selectedAttributeEntry, category.category), scoutingSettings),
			dForSvg: this.getDforSvg(
				getAvgValueForSpinner(true, getCategoryValues(selectedAttributeEntry, category.category), scoutingSettings)
			),
			items: getCategoryValues(selectedAttributeEntry, category.category).map((field: AdditionalFieldEntry) => ({
				label: this.translate.instant(field.metricName),
				value: field.value,
				cssStyle: this.getStyleForInputNumberForPdfReport(field.value, true, scoutingSettings),
				mode: 'text'
			}))
		}));
	}

	getStyleForInputNumberForPdfReport(
		value,
		isActiveAttributesDescriptionSettings: boolean,
		scoutingSettings: ScoutingSettings
	): string {
		return `background-color: ${getColorClass(
			value,
			1,
			isActiveAttributesDescriptionSettings,
			scoutingSettings
		)}; padding-left: 6px; padding-right: 6px; color: white`;
	}

	getAvgValue(
		playerAttributesEntry: PlayerAttributesEntry,
		category: MixedAttributeCategory,
		base: number,
		scoutingSettings: ScoutingSettings
	): string {
		if (category === 'potential') {
			return getLiteralAvg(playerAttributesEntry, 'potential');
		} else if (category === 'prognosis') {
			const value = getPlayerAttributesEntryValue(playerAttributesEntry, 'prognosisScore');
			return value ? String(value) : '-';
		}
		return getNumericalAvg(base, getCategoryValues(playerAttributesEntry, category), scoutingSettings);
	}

	getTeamName(teamId: string): Observable<string> {
		return this.teamList$.pipe(
			map(teams => {
				const team = teams.find(({ value }) => value === teamId);
				return team ? team.label : '';
			})
		);
	}

	getDforSvg(current: number, max = 100): string {
		const radius = 50;
		const stroke = 5;
		const arc = this.getArc(current, max, radius - stroke / 2, radius, true);
		return arc;
	}

	// this code is taken from https://github.com/crisbeto/angular-svg-round-progressbar
	/**
	 * Generates the value for an SVG arc.
	 *
	 * @param current Current value.
	 * @param total Maximum value.
	 * @param pathRadius Radius of the SVG path.
	 * @param elementRadius Radius of the SVG container.
	 * @param isSemicircle Whether the element should be a semicircle.
	 */
	getArc(current: number, total: number, pathRadius: number, elementRadius: number, isSemicircle = false): string {
		const value = Math.max(0, Math.min(current || 0, total));
		const maxAngle = isSemicircle ? 180 : 359.9999;
		const percentage = total === 0 ? maxAngle : (value / total) * maxAngle;
		const start = this._polarToCartesian(elementRadius, pathRadius, percentage);
		const end = this._polarToCartesian(elementRadius, pathRadius, 0);
		const arcSweep = percentage <= 180 ? 0 : 1;

		return `M ${start} A ${pathRadius} ${pathRadius} 0 ${arcSweep} 0 ${end}`;
	}

	/**
	 * Converts polar cooradinates to Cartesian.
	 *
	 * @param elementRadius Radius of the wrapper element.
	 * @param pathRadius Radius of the path being described.
	 * @param angleInDegrees Degree to be converted.
	 */
	private _polarToCartesian(elementRadius: number, pathRadius: number, angleInDegrees: number): string {
		const DEGREE_IN_RADIANS: number = Math.PI / 180;
		const angleInRadians = (angleInDegrees - 90) * DEGREE_IN_RADIANS;
		const x = elementRadius + pathRadius * Math.cos(angleInRadians);
		const y = elementRadius + pathRadius * Math.sin(angleInRadians);

		return x + ' ' + y;
	}
	//endregion
}
