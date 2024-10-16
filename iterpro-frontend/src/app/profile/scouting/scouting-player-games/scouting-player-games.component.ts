import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	Club,
	Customer,
	GameReportColumn,
	LoopBackAuth,
	PlayerScheduledGameModel,
	PlayerScouting,
	ReportDataColumn,
	ScoutingGame,
	ScoutingGameInit,
	ScoutingGameWithReport,
	ScoutingPlayerGamesTableRow,
	ScoutingSettings, TeamGender
} from '@iterpro/shared/data-access/sdk';
import { EditorDialogComponent } from '@iterpro/shared/ui/components';
import {
	AzureStoragePipe,
	AzureStorageService,
	BlockUiInterceptorService,
	CompetitionsConstantsService,
	ErrorService,
	ScoutingEventService,
	ScoutingGamesService,
	getId,
	getMomentFormatFromStorage,
	getUniqueReportDataColumns
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { groupBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ScoutingGameInterfaces } from 'src/app/+state/scouting-player-games-store';

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-player-games',
	templateUrl: './scouting-player-games.component.html',
	styleUrls: ['./scouting-player-games.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingPlayerGamesComponent implements OnChanges {
	scoutingGame: ScoutingGameInit;
	club: Club;
	@Input() player: PlayerScouting;
	@Input() customers: Customer[];
	@Input()
	recap: ScoutingGameInterfaces.ScoutingGamesRecap;
	@Input()
	tableGames: ScoutingPlayerGamesTableRow[] = [];
	@Output()
	action: EventEmitter<ScoutingGameInterfaces.Action> = new EventEmitter<ScoutingGameInterfaces.Action>();
	@Output()
	selectedGameEmitter: EventEmitter<ScoutingGameInit> = new EventEmitter<ScoutingGameInit>();

	columns: GameReportColumn[] = [];

	isScoutingAdmin = false;
	isTipssActive = false;
	private mode: 'add' | 'edit' = null;
	selectedReports: ScoutingPlayerGamesTableRow[] = [];

	private readonly standardColumns: GameReportColumn[] = [
		{
			field: 'completed',
			type: 'completed',
			header: 'complete',
			width: '100',
			frozen: false,
			sortable: true,
			align: 'center'
		},
		{
			field: 'start',
			type: 'date',
			header: 'general.date',
			width: '150',
			frozen: false,
			sortable: true,
			align: 'center'
		},
		{
			field: 'opponent',
			header: 'event.opponent',
			width: '200',
			frozen: false,
			sortable: true,
			align: 'center'
		},
		{
			field: 'level',
			type: 'level',
			header: 'scouting.game.level',
			width: '100',
			frozen: false,
			sortable: true,
			align: 'center'
		},
		{
			field: 'location',
			header: 'event.where',
			width: '200',
			frozen: false,
			sortable: true,
			align: 'center'
		},
		{
			field: 'report',
			type: 'report',
			header: 'scouting.game.reportText',
			width: '100',
			frozen: false,
			sortable: false,
			align: 'center'
		},
		{
			field: 'video',
			type: 'video',
			header: 'scouting.game.video',
			width: '100',
			frozen: false,
			sortable: false,
			align: 'center'
		},
		{
			field: 'document',
			type: 'document',
			header: 'scouting.game.document',
			width: '100',
			frozen: false,
			sortable: false,
			align: 'center'
		},
		{
			field: 'assignedTo',
			header: 'scouting.assignedTo',
			width: '200',
			frozen: false,
			sortable: true,
			align: 'center'
		},
		{
			field: 'author',
			header: 'tooltip.author',
			width: '200',
			frozen: false,
			sortable: true,
			align: 'center'
		}
	];

	hasScoutingGamePermission: boolean;
	reportDataColumns: ReportDataColumn[] = [];
	tieredMenuItems: MenuItem[];
	public tieredMenuLoading: boolean;
	constructor(
		private error: ErrorService,
		private currentTeamService: CurrentTeamService,
		private auth: LoopBackAuth,
		private dialogService: DialogService,
		private translateService: TranslateService,
		private azureStoragePipe: AzureStoragePipe,
		private changeDetectorRef: ChangeDetectorRef,
		private confirmationService: ConfirmationService,
		private azureStorageService: AzureStorageService,
		private scoutingGameService: ScoutingGamesService,
		private scoutingEventService: ScoutingEventService,
		private competitionsService: CompetitionsConstantsService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {
		this.hasScoutingGamePermission = this.scoutingGameService.hasScoutingAdminPermissions('scouting-games');
		this.isScoutingAdmin = this.scoutingGameService.hasScoutingAdminPermissions('scouting-games-report');
		const { club } = currentTeamService.getCurrentTeam();
		this.club = club;

		const settings: ScoutingSettings = club.scoutingSettings;

		this.isTipssActive = settings.gameReport === 'tipss';
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['tableGames']) {
			if (this.tableGames) {
				this.loadReportDataColumns();
				this.loadPlayerNextGame();
			}
		}
	}

	private loadReportDataColumns() {
		this.reportDataColumns = getUniqueReportDataColumns(this.tableGames.map(({ game }) => game?.reportData));
		const dataCol: GameReportColumn[] = this.reportDataColumns.map(col => ({
			field: col.key,
			type: col.type,
			header: col.label,
			width: col.type === 'booleanType' ? '100' : '200',
			frozen: false,
			sortable: true,
			align: 'center'
		}));
		this.columns = [...this.standardColumns, ...dataCol];
	}

	isTrashRowDisabled(reportRow: ScoutingGameWithReport): boolean {
		return (
			this.selectedReports.length > 1 || !this.selectedReports.find(({ game }) => getId(game) === getId(reportRow))
		);
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}

	downloadVideo(url: string, fileName: string) {
		const azureUrl = this.azureStoragePipe.transform(url);
		saveAs(azureUrl, fileName);
	}

	openReportDialog(gameReportRow: ScoutingGame) {
		this.dialogService.open(EditorDialogComponent, {
			data: { editable: false, content: gameReportRow['report'] },
			width: '50%',
			header: this.translateService.instant('scouting.game.reportText')
		});
	}

	createGame(playerChooseGame?: PlayerScheduledGameModel) {
		this.mode = 'add';
		this.scoutingGame = this.getScoutingGameInit(undefined, undefined, playerChooseGame);
		this.selectedGameEmitter.emit(this.scoutingGame);
	}

	onEditClicked(game: ScoutingGameWithReport) {
		this.getCompleteGame(game);
	}

	private getCompleteGame(game: ScoutingGameWithReport) {
		this.blockUiInterceptorService.disableOnce(this.scoutingGameService.getMissingData(game.scoutingGameId)).subscribe({
			next: (missingData: Partial<ScoutingGame>) => this.editGame({ ...game, ...missingData }),
			error: (error: string) => this.error.handleError(error)
		});
	}

	private editGame(game: ScoutingGameWithReport) {
		this.mode = 'edit';
		this.scoutingGame = this.getScoutingGameInit(game);
		this.selectedGameEmitter.emit(this.scoutingGame);
	}

	private getScoutingGameInit(
		selectedGame: ScoutingGameWithReport,
		date?: Date,
		playerChooseGame?: PlayerScheduledGameModel
	): ScoutingGameInit {
		const currentUser = {
			id: this.auth.getCurrentUserData().id,
			firstName: this.auth.getCurrentUserData().firstName,
			lastName: this.auth.getCurrentUserData().lastName
		};
		return {
			game: selectedGame
				? this.getBasicScoutingGameForEvent(selectedGame)
				: this.getBasicNextEvent(playerChooseGame, date),
			hasScoutingGamePermission: this.hasScoutingGamePermission,
			isScoutingAdmin: this.isScoutingAdmin,
			isAdminOrUniqueScout:
				!getId(selectedGame) ||
				(selectedGame as ScoutingGameWithReport & { isAdminOrUniqueScout: boolean }).isAdminOrUniqueScout, // TODO Implement this
			customer: currentUser,
			customers: this.customers.map(({ id, firstName, lastName }) => ({ id, firstName, lastName })),
			settings: {
				activeGameReportTemplateId: this.club.scoutingSettings.activeGameReportTemplateId,
				activeGameReportTemplateVersion: this.club.scoutingSettings.activeGameReportTemplateVersion,
				profileCreation: this.club.scoutingSettings.profileCreation
			},
			existingScoutingPlayers: [this.player],
			playersToPredisposeReports: [{ id: this.player.id, thirdPartyId: this.player.wyscoutId }],
			sourceSection: 'scoutingProfile',
			teamGender: this.currentTeamService.getCurrentTeam().gender as TeamGender
		};
	}

	private loadPlayerNextGame() {
		this.tieredMenuLoading = true;
		if (!this.player.wyscoutId) {
			this.setupTieredMenu();
		} else {
			const currentSeason = this.currentTeamService.getCurrentSeason();
			this.scoutingEventService
				.getCurrentSeasonMatches(this.player.wyscoutId, currentSeason?.inseasonStart, currentSeason.inseasonEnd)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (games: PlayerScheduledGameModel[]) => {
						this.setupTieredMenu(games);
					},
					error: (error: string) => this.error.handleError(error)
				});
		}
	}

	private getCompetitionName(competitions: SelectItem[], competitionId: number): string {
		return competitions.find(competition => competition.value === competitionId)?.label;
	}

	private getGroupedAndSortedCompetitions(
		competitions: SelectItem[] = [],
		games: PlayerScheduledGameModel[] = []
	): PlayerScheduledGameModel[][] {
		const groupedByCompetition = groupBy(games, 'competitionId');
		return Object.values(groupedByCompetition).sort((a, b) =>
			this.getCompetitionName(competitions, a[0].competitionId).localeCompare(
				this.getCompetitionName(competitions, b[0].competitionId)
			)
		);
	}

	private setupTieredMenu(games: PlayerScheduledGameModel[] = []) {
		const basicGame: MenuItem = {
			label: this.translateService.instant('Custom Game'),
			command: () => this.createGame()
		};
		const competitions = this.competitionsService.withProvider('Wyscout').getCompetitions();
		const filteredGames = games.filter(({competitionId}) => competitions.some(({value}) => value === competitionId));
		if (filteredGames?.length !== games?.length) {
			const notFoundCompetitions = games.filter(({competitionId}) => !competitions.some(({value}) => value === competitionId));
			this.error.handleError(
				`Some competitions missing: ${uniqBy(notFoundCompetitions, 'competitionId').map(({competitionId}) => competitionId).join(', ')}. Please contact the Iterpro support.`
			);
		}
		const tieredMenus: MenuItem[] = Object.values(this.getGroupedAndSortedCompetitions(competitions, filteredGames)).map(
			(competitionGames: PlayerScheduledGameModel[]) => {
				const nextGames: MenuItem = {
					label: this.translateService.instant('scouting.gameReport.next'),
					items: competitionGames
						.filter(({ played }) => !played)
						.map(game => ({
							label: moment(game.date).format(getMomentFormatFromStorage()) + ' - ' + game.label,
							command: () => this.createGame(game),
							styleClass: 'subMenuWidth-310'
						}))
				};
				const pastGames: MenuItem = {
					label: this.translateService.instant('scouting.gameReport.past'),
					items: competitionGames
						.filter(({ played }) => played)
						.map(game => ({
							label: moment(game.date).format(getMomentFormatFromStorage()) + ' - ' + game.label,
							command: () => this.createGame(game),
							styleClass: 'subMenuWidth-310'
						}))
				};
				const menuItem = <MenuItem>{
					label: this.getCompetitionName(competitions, competitionGames[0].competitionId),
					items: []
				};
				if (nextGames.items.length) {
					menuItem.items.push(nextGames);
				}
				if (pastGames.items.length) {
					menuItem.items.push(pastGames);
				}
				return menuItem;
			}
		);
		this.tieredMenuItems = [basicGame, { separator: tieredMenus?.length > 0 }, ...(tieredMenus || [])];
		this.tieredMenuLoading = false;
		this.changeDetectorRef.detectChanges();
	}

	private getBasicScoutingGameForEvent(game: ScoutingGameWithReport): ScoutingGame {
		// @ts-ignore
		return {
			assignedTo: game.assignedTo,
			author: game.author,
			awayTeam: game.awayTeam,
			clubId: game.clubId,
			completed: game.completed,
			endTime: game.endTime,
			history: game.history,
			homeTeam: game.homeTeam,
			id: game.scoutingGameId,
			sent: game.sent,
			start: game.start,
			startTime: game.startTime,
			teamId: game.teamId,
			thirdPartyProvider: game.thirdPartyProvider,
			thirdPartyProviderAwayTeamId: game.thirdPartyProviderAwayTeamId,
			thirdPartyProviderCompetitionId: game.thirdPartyProviderCompetitionId,
			thirdPartyProviderHomeTeamId: game.thirdPartyProviderHomeTeamId,
			thirdPartyProviderMatchId: game.thirdPartyProviderMatchId,
			title: game.title,
			_attachments: game._attachments
		};
	}

	private getBasicNextEvent(choosePlayerGame?: PlayerScheduledGameModel, todayDate?: Date): ScoutingGame {
		const game: Partial<ScoutingGame> = this.scoutingGameService.getEmptyNew(todayDate);
		if (!choosePlayerGame) return game as ScoutingGame;
		// @ts-ignore
		return new ScoutingGame({
			...game,
			start: choosePlayerGame.date,
			thirdPartyProvider: 'Wyscout',
			thirdPartyProviderCompetitionId: choosePlayerGame.competitionId,
			thirdPartyProviderMatchId: choosePlayerGame.matchId,
			title: choosePlayerGame.label
		});
	}

	askToDeleteScoutingGameReports(rowGame?: ScoutingGameWithReport) {
		this.confirmationService.confirm({
			message: this.translateService.instant(rowGame ? 'confirm.delete' : 'confirm.deleteAll'),
			header: this.translateService.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				const gamesToDelete = rowGame ? [rowGame] : this.selectedReports.map(({ game }) => game);
				this.deleteScoutingGameReports(gamesToDelete);
			}
		});
	}

	private deleteScoutingGameReports(gameReportsToDelete: ScoutingGameWithReport[]) {
		this.action.emit({ target: gameReportsToDelete, action: 'deleteGameReports' });
		this.selectedReports = [];
	}
}
