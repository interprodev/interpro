import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	HostListener,
	Injector,
	OnDestroy,
	OnInit
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { environment } from '@iterpro/config';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproTeamModule, PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	CustomerApi,
	CustomerTeamSettingsApi,
	Event,
	EventApi,
	LoopBackAuth,
	Player,
	PlayerApi,
	ResultWithQueueMessage,
	SessionPlayerData,
	Team,
	TeamSeason,
	TeamSeasonApi,
	Test,
	TestApi,
	Wellness,
	WellnessApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	CalendarService,
	CanComponentDeactivate,
	EditModeService,
	ErrorService,
	ToServerEquivalentService,
	getMomentFormatFromStorage,
	getTeamSettings,
	handleQueuePlayerRecalculationAlerts,
	isNotArchived,
	isNotEmpty,
	sortByDate,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, Observer, Subscription, combineLatest, forkJoin } from 'rxjs';
import { first, map, pluck, switchMap, tap } from 'rxjs/operators';
import { calcSleepDuration } from './utils/assessments.util';
import { Store } from '@ngrx/store';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { SeasonStoreSelectors } from 'src/app/+state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export enum AssessmentsViewState {
	Surveys = 0,
	Tests = 1
}

@UntilDestroy()
@Component({
	templateUrl: './assessments.component.html',
	styleUrls: ['./assessments.component.css']
})
export class AssessmentsComponent
	extends EtlBaseInjectable
	implements CanComponentDeactivate, OnInit, OnDestroy, AfterViewChecked
{
	instanceIdParam: any;
	modelIdParam: any;
	currentViewState: AssessmentsViewState = AssessmentsViewState.Surveys;
	teamView = true;
	surveyTypes: SelectItem[];
	selectedType = 'wellness';
	tempSelectedType = this.selectedType;

	sessions: SelectItem[] = [];
	selectedSession: Event;

	sessionPlayers: SessionPlayerData[] = [];
	selectedSessionPlayerData: SessionPlayerData;

	players: Player[] = [];
	selectedPlayer: Player;

	currentDay: Date;
	today: Date;

	tests: SelectItem[];
	filteredTests: SelectItem[];
	selectedTest: Test;
	newTest: boolean;
	currentTeam: Team;
	purposeList: SelectItem[];
	indexTabSurveyTest = 0;
	route$: Observable<any>;
	dropdownSessionPlayers: Array<{ label: any; value: any }>;
	receivedTabIndex = 0;
	customer: any;
	currentPinnedTestsIds: any[];
	teamSettingsToUpdate: any;

	selectedSeason: TeamSeason;

	constructor(
		private error: ErrorService,
		private testApi: TestApi,
		private teamSeasonApi: TeamSeasonApi,
		private wellnessApi: WellnessApi,
		private auth: LoopBackAuth,
		private authService: PermissionsService,
		private alertService: AlertService,
		private calendar: CalendarService,
		public editService: EditModeService,
		private confirmation: ConfirmationService,
		private translate: TranslateService,
		private playerApi: PlayerApi,
		private cdRef: ChangeDetectorRef,
		private eventApi: EventApi,
		private route: ActivatedRoute,
		private currentTeamService: CurrentTeamService,
		private customerTeamSettingsApi: CustomerTeamSettingsApi,
		private customerApi: CustomerApi,
		private toServer: ToServerEquivalentService,
		private readonly store$: Store<RootStoreState>,
		injector: Injector
	) {
		super(injector);
	}

	ngAfterViewChecked() {
		this.cdRef.detectChanges();
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmation.confirm({
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

	ngOnDestroy() {}

	ngOnInit() {
		this.today = new Date();
		this.newTest = false;
		this.currentTeam = this.currentTeamService.getCurrentTeam();
		this.route$ = this.route.paramMap.pipe(
			untilDestroyed(this),
			switchMap((params: ParamMap) => {
				if (params['params']) {
					this.modelIdParam = params['params'].testId;
					this.instanceIdParam = params['params'].id;
				}
				return this.translate.getTranslation(this.translate.currentLang);
			})
		);

		this.store$
			.select(SeasonStoreSelectors.selectDefault)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (season: TeamSeason) => {
					this.selectedSeason = season;
					const day = !moment().isBetween(season.offseason, season.inseasonEnd)
						? moment(season.inseasonEnd).toDate()
						: this.today;
					if (this.selectedType === 'rpe') {
						this.getSessionImports();
					} else {
						this.handleDateSelect(day);
					}
				}
			});

		this.route$.subscribe({
			next: () => {
				this.loadPurpose();
				if (this.modelIdParam) this.handleTabChange({ index: 1 });
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	viewIsSurvey(): boolean {
		return this.currentViewState === AssessmentsViewState.Surveys;
	}

	viewIsTest(): boolean {
		return this.currentViewState === AssessmentsViewState.Tests;
	}

	private loadPurpose() {
		this.purposeList = sortByName(
			[
				{ label: this.translate.instant('tests.purpose.agility'), value: 'Agility' },
				{ label: this.translate.instant('tests.purpose.strength'), value: 'Strength' },
				{ label: this.translate.instant('tests.purpose.speed'), value: 'Speed' },
				{ label: this.translate.instant('tests.purpose.power'), value: 'Power' },
				{ label: this.translate.instant('tests.purpose.aerobic'), value: 'Aerobic' },
				{ label: this.translate.instant('tests.purpose.anaerobic'), value: 'Anaerobic' },
				{ label: this.translate.instant('tests.purpose.coordination'), value: 'Coordination' },
				{ label: this.translate.instant('tests.purpose.reaction'), value: 'Reaction' },
				{ label: this.translate.instant('tests.purpose.sportSpecific'), value: 'Sport Specific' },
				{ label: this.translate.instant('tests.purpose.balance'), value: 'Balance' },
				{ label: this.translate.instant('tests.purpose.movementScreening'), value: 'Movement Screening' },
				{ label: this.translate.instant('tests.purpose.psychology'), value: 'Psychology' },
				{ label: this.translate.instant('tests.purpose.anthropometry'), value: 'Anthropometry' },
				{ label: this.translate.instant('tests.purpose.cns'), value: 'CNS' },
				{ label: this.translate.instant('tests.purpose.ans'), value: 'ANS' },
				{ label: this.translate.instant('tests.purpose.hydration'), value: 'Hydration' },
				{ label: this.translate.instant('tests.purpose.haematology'), value: 'Haematology' },
				{ label: this.translate.instant('tests.purpose.sleep'), value: 'Sleep' },
				{ label: this.translate.instant('tests.purpose.adrenal'), value: 'Adrenal' },
				{ label: this.translate.instant('tests.purpose.cardiovascular'), value: 'Cardiovascular' },
				{ label: this.translate.instant('tests.purpose.metabolic'), value: 'Metabolic' }
			],
			'value'
		);
		this.surveyTypes = [
			{ label: this.translate.instant('surveys.type.wellness'), value: 'wellness' },
			{ label: this.translate.instant('surveys.type.rpe'), value: 'rpe' }
		];
	}

	/**
	 * This (parent component ) receive the value of index from test component (child component)
	 * @param index : 0 for protocol tab / 1 for records tab
	 */
	tabIndex(index: any) {
		this.receivedTabIndex = index;
	}

	handleTabChange(e) {
		if (e.index === AssessmentsViewState.Surveys) {
			this.currentViewState = AssessmentsViewState.Surveys;
		} else {
			this.currentViewState = AssessmentsViewState.Tests;
			this.loadPinnedAndTests();
		}
	}

	handleSurveyChange(e) {
		if (this.editService.editMode) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.selectedType = e.value;
					this.editService.editMode = false;
					if (this.selectedType === 'rpe') {
						this.getSessionImports();
					}
				},
				reject: () => {
					this.tempSelectedType = this.selectedType;
				}
			});
		} else {
			this.selectedType = e.value;
			if (this.selectedType === 'rpe') {
				this.getSessionImports();
			}
		}
	}

	getSelectedPlayer(): Player {
		return (this.players || []).find(({ id }) => id === this.selectedPlayer?.id);
	}

	handleDateSelect(e: Date) {
		this.currentDay = e;
		this.getWellnesses(this.currentDay);
	}

	handleWellnessSelect(playerId: string) {
		this.selectedPlayer = this.players.find(({ id }) => id === playerId);
	}

	handlePlayerSelect(e) {
		this.selectedSessionPlayerData = cloneDeep(e);
	}

	handlePlayerSelectFirst(sessions) {
		if (sessions?.length > 0) {
			this.selectedSessionPlayerData = cloneDeep(sessions[0]);
		}
	}

	handlePurposeChange(event) {
		const ps = event.value;
		if (!ps || ps?.length === 0) {
			this.filteredTests = this.tests;
		} else {
			this.filteredTests = this.tests.filter(({ value }) => {
				if (!value.purpose) return false;
				else {
					return value.purpose.find(val => ps.indexOf(val) !== -1);
				}
			});
		}
	}

	private getWellnesses(date: Date) {
		this.players = [];
		this.teamSeasonApi
			.getPlayers(this.selectedSeason.id, {
				include: {
					relation: 'wellnesses',
					scope: {
						where: {
							and: [
								{
									date: {
										gte: this.toServer.convert(moment(date).startOf('day').toDate())
									}
								},
								{
									date: {
										lt: this.toServer.convert(moment(date).endOf('day').toDate())
									}
								}
							]
						}
					}
				},
				order: 'displayName ASC'
			})
			.pipe(
				map((players: Player[]) => (players || []).filter(player => isNotArchived(player, date))),
				map((players: Player[]) => {
					this.players = sortByName(
						(players || []).map(player => {
							return {
								...player,
								wellnesses: player.wellnesses.filter(({ date }) => !player.archived || player.archivedDate > date)
							};
						}),
						'displayName'
					);
				}),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => this.selectPlayer(this.getSelectedPlayer()),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getSessionImports() {
		this.sessions = [];
		this.selectedSessionPlayerData = null;

		const startDate = moment(this.selectedSeason.offseason).startOf('day').toDate();
		let endDate = moment(this.selectedSeason.inseasonEnd).startOf('day').toDate();
		if (moment().isSameOrBefore(moment(endDate))) endDate = moment().toDate();
		this.eventApi
			.getEventsOnlySessionImport(this.auth.getCurrentUserData().currentTeamId, [], false, startDate, endDate)
			.pipe(
				pluck('events'),
				map((events: Event[]) => events.filter(({ start }) => moment(start).isSameOrBefore(moment()))),
				map((events: Event[]) => {
					events = sortByDate(events, 'start').reverse();
					this.sessions = (events || []).map(event => ({ label: this.getEventTitle(event), value: event }));
				}),
				tap(() => {
					if (this.sessions.length === 0) {
						this.alertService.notify('error', 'assessment', 'alert.noGPSImportSessionsFound', false);
					}
				}),
				// map(() => (this.selectedSession = this.sessions[0].value)),
				untilDestroyed(this)
			)
			.subscribe(
				() => this.handleSessionSelect(this.sessions[0].value),
				(error: Error) => this.error.handleError(error)
			);
	}

	private getEventTitle(event: Event) {
		const start = moment(event.start).format(`${getMomentFormatFromStorage()} hh:mm`);
		const gd = this.calendar.getGD(event.start);
		const title = event.format === 'training' ? `TRAINING ${gd}` : `GAME vs ${event.opponent}`;
		return `${start} - ${title}`;
	}

	handleSessionSelect(session: Event) {
		if (session) {
			this.selectedSession = session;
			this.getSessionPlayers();
		}
	}

	private getSessionPlayers() {
		this.eventApi
			.getEventWithSessionPlayerData(this.selectedSession.id)
			.pipe(
				pluck('_sessionPlayers'),
				first(),
				tap((results: SessionPlayerData[]) => {
					if (results.length === 0) {
						this.alertService.notify('error', 'assessment', 'alert.noGPSPlayerSessionsFound', false);
					}
				}),
				map((results: SessionPlayerData[]) => {
					this.selectedSession._sessionPlayers = results || [];
					this.sessionPlayers = sortByName(this.selectedSession._sessionPlayers, 'playerName');
				}),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => this.selectPlayer(this.getSelectedPlayer()),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private selectPlayer(player: Player) {
		if (this.selectedType === 'wellness') {
			if (player) {
				this.handleWellnessSelect(player.id);
			} else {
				this.handleWellnessSelect(this.players[0].id);
			}
		} else if (this.selectedType === 'rpe') {
			if (this.selectedSessionPlayerData) {
				const foundSession = this.sessionPlayers.find(({ id }) => id === this.selectedSessionPlayerData.id);
				if (foundSession) this.handlePlayerSelect(foundSession);
				else this.handlePlayerSelectFirst(this.sessionPlayers);
			} else {
				this.handlePlayerSelectFirst(this.sessionPlayers);
			}
		}
	}

	loadPinnedAndTests(event?: Test) {
		// Getting pinned test information per customer per team.
		this.customerApi
			.getCurrent({ include: ['teamSettings'] })
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: any) => {
					this.customer = result;
					this.teamSettingsToUpdate = getTeamSettings(
						this.customer.teamSettings,
						this.auth.getCurrentUserData().currentTeamId
					);
					this.currentPinnedTestsIds = this.teamSettingsToUpdate.pinnedTestsIds;
					this.loadTests(event);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	loadTests(event?: Test) {
		let tempTests = [];
		let tempFilteredTests = [];
		this.testApi
			.find({
				where: {
					teamId: { inq: [this.auth.getCurrentUserData().currentTeamId, 'GLOBAL'] },
					medical: false
				},
				include: {
					relation: 'instances',
					scope: {
						where: { teamId: this.auth.getCurrentUserData().currentTeamId },
						fields: ['id', 'date']
					}
				},
				order: 'name ASC'
			})
			.pipe(untilDestroyed(this))
			.subscribe(
				(tests: Test[]) => {
					tests.forEach(x => {
						tempFilteredTests.push({ label: x.name, value: x });
						tempTests.push({ label: x.name, value: x });
					});
					tempTests = this.sortByPinned(tempTests);
					tempFilteredTests = this.sortByPinned(tempFilteredTests);
					if (event || this.modelIdParam) {
						const selected = this.modelIdParam
							? tempTests.find(({ value }) => value.id === this.modelIdParam)
							: tempFilteredTests.find(({ value }) => value.id === event.id);
						if (selected) {
							event = selected.value;
							this.selectedTest = event;
							this.newTest = false;
							this.modelIdParam = null;
						} else this.selectedTest = null;
					} else this.selectedTest = null;
					this.tests = tempTests;
					this.filteredTests = tempFilteredTests;
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	// Putting all the pinned tests at top of the list.
	private sortByPinned(tests) {
		return tests.sort((a, b) => {
			if (
				this.currentPinnedTestsIds &&
				this.currentPinnedTestsIds.includes(a.value.id) &&
				this.currentPinnedTestsIds.includes(b.value.id)
			) {
				return 0;
			}
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(a.value.id)) {
				return -1;
			}
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(b.value.id)) {
				return 1;
			}
		});
	}

	selectTest(test: SelectItem<Test>) {
		if (!this.editService.editMode) {
			this.selectedTest = test.value;
			this.newTest = false;
			this.modelIdParam = null;
		}
	}

	addNewTest() {
		this.selectedTest = new Test({
			name: '',
			medical: false
		});
		this.selectedTest.instances = [];
		this.newTest = true;
	}

	onDiscardAdd() {
		if (this.newTest) {
			this.selectedTest = undefined;
			this.newTest = false;
		}
	}

	private deleteWellness(selectedPlayer: Player) {
		if (selectedPlayer.wellnesses[0].id) {
			this.wellnessApi
				.deleteById(selectedPlayer.wellnesses[0].id)
				.pipe(untilDestroyed(this))
				.subscribe(
					(wellness: any) => {
						this.getWellnesses(this.currentDay);
						delete selectedPlayer.wellnesses[0];
						this.alertService.notify('success', 'assessment', 'alert.recordDeleted', false);
					},
					(error: Error) => this.error.handleError(error)
				);
		}
	}

	private saveWellness(selectedPlayer: Player) {
		const newDate = this.toServer.convert(moment(selectedPlayer.wellnesses[0].date).startOf('day').toDate());
		selectedPlayer.wellnesses[0].date = newDate;
		if (selectedPlayer.wellnesses[0].id) {
			this.wellnessApi
				.updateAttributes(selectedPlayer.wellnesses[0].id, selectedPlayer.wellnesses[0])
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (wellness: Wellness) => {
						selectedPlayer.wellnesses[0] = wellness;
						this.getWellnesses(this.currentDay);
						this.alertService.notify('success', 'assessment', 'alert.recordUpdated', false);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.playerApi
				.createWellnesses(selectedPlayer.id, selectedPlayer.wellnesses[0])
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (wellness: Wellness) => {
						selectedPlayer.wellnesses[0] = wellness;
						this.getWellnesses(this.currentDay);
						this.alertService.notify('success', 'assessment', 'alert.recordCreated', false);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private deleteRPE(session: SessionPlayerData) {
		const sessLinked = this.selectedSession._sessionPlayers.find(({ id }) => id === session.id);
		if (sessLinked) {
			sessLinked.rpe = session.rpe;
			sessLinked.rpeTl = sessLinked.rpe * sessLinked.duration;
		}
		const attributesToUpdate = { ...this.selectedSession };
		delete attributesToUpdate.id;
		delete attributesToUpdate['_id'];
		this.eventApi
			.updateAttributes(this.selectedSession.id, attributesToUpdate)
			.pipe(untilDestroyed(this))
			.subscribe(
				() => {
					this.getSessionPlayers();
					this.alertService.notify('success', 'assessment', 'alert.recordDeleted', false);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private saveRPE(session: SessionPlayerData) {
		const sessLinked = this.selectedSession._sessionPlayers.find(({ id }) => String(id) === String(session.id));
		if (sessLinked) {
			sessLinked.rpe = session.rpe;
			if (this.selectedSession.format !== 'training' && isNotEmpty(this.selectedSession._playerMatchStats)) {
				const stat = this.selectedSession._playerMatchStats.find(({ playerId }) => playerId === sessLinked.playerId);
				if (stat) sessLinked.rpeTl = sessLinked.rpe * stat.minutesPlayed;
			} else {
				sessLinked.rpeTl = sessLinked.rpe * sessLinked.duration;
			}
		}

		this.eventApi
			.saveEventRpe(this.selectedSession, null)
			.pipe(untilDestroyed(this))
			.subscribe(
				(result: ResultWithQueueMessage) => {
					this.getSessionPlayers();
					this.alertService.notify('success', 'assessment', 'alert.recordUpdated', false);
					if (!environment.production) {
						handleQueuePlayerRecalculationAlerts(this.players, result, this.alertService);
					}
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	confirmDelete(object) {
		this.confirmation.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.deleteWellness(object);
			}
		});
	}

	confirmEdit(player: Player) {
		if (player.wellnesses[0].id) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.saveWellness(player);
				}
			});
		} else {
			this.saveWellness(player);
		}
	}

	confirmDeleteRPE(object) {
		this.confirmation.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.deleteRPE(object);
			}
		});
	}

	confirmEditRPE(object: SessionPlayerData) {
		if (this.selectedSessionPlayerData.id) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.saveRPE(object);
				}
			});
		} else {
			this.saveRPE(object);
		}
	}

	confirmEditRPETeam(sessions: SessionPlayerData[]) {
		if (sessions) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.saveMultipleRPE(sessions);
				}
			});
		}
	}

	confirmDeleteRPETeam(sessions: SessionPlayerData[]) {
		if (sessions) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.deleteMultipleRPE(sessions);
				}
			});
		}
	}

	private deleteMultipleRPE(sessions: SessionPlayerData[]) {
		for (const sess of sessions) {
			const sessLinked = this.selectedSession._sessionPlayers.find(({ id }) => id === sess.id);
			if (sessLinked) {
				sessLinked.rpe = null;
				sessLinked.rpeTl = null;
			}
		}
		const attributesToUpdate = { ...this.selectedSession };
		delete attributesToUpdate.id;
		delete attributesToUpdate['_id'];

		this.eventApi
			.updateAttributes(this.selectedSession.id, attributesToUpdate)
			.pipe(untilDestroyed(this))
			.subscribe(
				(eventSaved: Event) => {
					this.getSessionPlayers();
					this.alertService.notify('success', 'assessment', 'alert.recordDeleted', false);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private saveMultipleRPE(sessions: SessionPlayerData[]) {
		const sessionsToUpdate = cloneDeep(this.selectedSession);
		for (const sess of sessions) {
			const sessLinked = sessionsToUpdate._sessionPlayers.find(({ id }) => id === sess.id);
			if (sessLinked) {
				sessLinked.rpe = sess.rpe;
				if (sessionsToUpdate.format !== 'training' && isNotEmpty(sessionsToUpdate._playerMatchStats)) {
					const stat = sessionsToUpdate._playerMatchStats.find(({ playerId }) => playerId === sessLinked.playerId);
					if (stat) sessLinked.rpeTl = sessLinked.rpe ? sessLinked.rpe * stat.minutesPlayed : null;
				} else {
					sessLinked.rpeTl = sessLinked.rpe ? sessLinked.rpe * sessLinked.duration : null;
				}
			}
		}
		this.eventApi
			.saveEventRpe(sessionsToUpdate, null)
			.pipe(untilDestroyed(this))
			.subscribe(
				(result: ResultWithQueueMessage) => {
					if (result.result) {
						this.getSessionPlayers();
						this.editService.editMode = false;
						this.alertService.notify('success', 'assessment', 'alert.recordUpdated', false);
						if (!environment.production) {
							handleQueuePlayerRecalculationAlerts(this.players, result, this.alertService);
						}
					}
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	confirmEditWellnessTeam(wellnesses) {
		if (wellnesses) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.saveMultipleWellness(wellnesses);
				}
			});
		}
	}

	confirmDeleteWellnessTeam(wellnesses) {
		if (wellnesses) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.deleteMultipleWellness(wellnesses);
				}
			});
		}
	}

	private deleteMultipleWellness(wellnesses) {
		const obs = [];
		for (const we of wellnesses) {
			if (we.wellness_id) {
				const currentObs = this.wellnessApi.deleteById(we.wellness_id);
				obs.push(currentObs);
			}
		}

		forkJoin(obs)
			.pipe(untilDestroyed(this))
			.subscribe(
				(results: any[]) => {
					this.alertService.notify('success', 'assessment', 'alert.recordUpdated', false);
					this.getWellnesses(this.currentDay);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	incompleteWellness(e) {
		this.alertService.notify('error', 'error', 'alert.incompleteWellness', false);
	}

	csvUploaded() {
		this.alertService.notify('info', 'assessment', 'alert.csvUploadedCorrectly', false);
	}

	private getWellnessLocationsValues(bodyLocations: any[]): any {
		if (bodyLocations && bodyLocations.length > 0) {
			return bodyLocations
				.map(bodyLocation => this.translate.instant(`medical.infirmary.details.location.${bodyLocation}`))
				.join(';')
				.toString();
		}
	}

	downloadCsvWellness() {
		const tempPlayers = this.players.map(value => ({
			displayName: value.displayName,
			date: moment(this.currentDay).startOf('day').format(getMomentFormatFromStorage()),
			wellness_sleep: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].wellness_sleep : null,
			wellness_sleeptime: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].sleep_start : null,
			wellness_wakeuptime: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].sleep_end : null,
			wellness_sleep_hours:
				value.wellnesses && value.wellnesses.length > 0
					? calcSleepDuration(value.wellnesses[0].sleep_start, value.wellnesses[0].sleep_end)
					: null,
			wellness_mood: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].wellness_mood : null,
			wellness_stress: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].wellness_stress : null,
			wellness_soreness: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].wellness_soreness : null,
			wellness_sorenesslocation:
				value.wellnesses && value.wellnesses.length > 0 && value.wellnesses.length > 0
					? this.getWellnessLocationsValues(value.wellnesses[0].locations)
					: null,
			wellness_fatigue: value.wellnesses && value.wellnesses.length > 0 ? value.wellnesses[0].wellness_fatigue : null
		}));

		const results = Papa.unparse(tempPlayers, {});

		const fileName = 'Wellness_' + moment(this.currentDay).startOf('day').format(getMomentFormatFromStorage()) + '.csv';

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	downloadCsvRpe(date: Date) {
		const rpes = this.sessionPlayers.map(({ playerName, date, rpe }) => ({
			displayName: playerName,
			date: moment(date).format(getMomentFormatFromStorage()),
			rpe
		}));

		const results = Papa.unparse(rpes, {});
		const fileName = `RPE_${moment(date).format(`${getMomentFormatFromStorage()} hh:mm`)}.csv`;

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	private saveMultipleWellness(playersWellnesses) {
		const obs = [];
		for (const plWell of playersWellnesses) {
			if (
				plWell.wellness_soreness != null &&
				plWell.sleep_start != null &&
				plWell.sleep_end != null &&
				plWell.wellness_fatigue != null &&
				plWell.wellness_stress &&
				plWell.wellness_mood &&
				plWell.wellness_sleep
			) {
				const data = {
					date: this.toServer.convert(moment(this.currentDay).startOf('day').toDate()),
					wellness_stress: plWell.wellness_stress,
					sleep_start: plWell.sleep_start,
					sleep_end: plWell.sleep_end,
					wellness_fatigue: plWell.wellness_fatigue,
					wellness_mood: plWell.wellness_mood,
					wellness_soreness: plWell.wellness_soreness,
					wellness_sleep: plWell.wellness_sleep,
					locations: plWell.locations,
					score: null
				};
				const currentObs = plWell.wellness_id
					? this.wellnessApi.patchAttributes(plWell.wellness_id, data)
					: this.wellnessApi.create(new Wellness({ ...data, playerId: plWell.id }));
				obs.push(currentObs);
			}
		}

		forkJoin(obs)
			.pipe(untilDestroyed(this))
			.subscribe(
				(results: any[]) => {
					this.editService.editMode = false;
					this.alertService.notify('success', 'assessment', 'alert.recordUpdated', false);
					this.getWellnesses(this.currentDay);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	// Find if all the tests pinned by customer for selected team.
	isTestPinned(testReceived): boolean {
		const currentTeamSettings = getTeamSettings(
			this.customer.teamSettings,
			this.auth.getCurrentUserData().currentTeamId
		);
		const pinnedtestIds = currentTeamSettings ? currentTeamSettings.pinnedTestsIds : [];
		return pinnedtestIds && pinnedtestIds.length > 0 && pinnedtestIds.includes(testReceived.value.id);
	}

	// Saving pinned test ids.
	savePin(event, testReceived) {
		event.stopPropagation();
		let pinnedTestsIds = [];

		// toggle pin value by removing or adding testIds from customerTestsIds array of CustomerTeamSettings
		if (this.currentPinnedTestsIds) {
			if (this.currentPinnedTestsIds.includes(testReceived.value.id)) {
				//  Found, Remove
				this.currentPinnedTestsIds = this.currentPinnedTestsIds.filter(item => item !== testReceived.value.id);
			} else {
				// Now Found, Add
				this.currentPinnedTestsIds.push(testReceived.value.id);
			}
			pinnedTestsIds = this.currentPinnedTestsIds;
		}

		// destructurization to edit the teamSettingsToUpdate object
		this.teamSettingsToUpdate = { ...this.teamSettingsToUpdate, pinnedTestsIds };

		// Saving teamSettings(current team) to db for current customer.
		this.customerTeamSettingsApi
			.patchAttributes(this.teamSettingsToUpdate.id, { pinnedTestsIds })
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: any) => {
					this.loadPinnedAndTests(null); // refesh test list.
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	hasPermissions(module: IterproTeamModule): boolean {
		return this.authService.canTeamAccessToModule(module, this.currentTeam).response;
	}
}
