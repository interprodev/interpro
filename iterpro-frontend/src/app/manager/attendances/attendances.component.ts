import {
	AfterViewChecked,
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	OnDestroy,
	OnInit,
	ViewChild
} from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { Team } from '@iterpro/shared/data-access/sdk';
import {
	BlockUiInterceptorService,
	CompetitionsConstantsService,
	ErrorService,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { first, map, withLatestFrom } from 'rxjs/operators';
import { IterproBlockTemplateComponent } from 'src/app/shared/block-template/block-template.component';
import {
	AttendancesStoreActions,
	AttendancesStoreSelectors,
	Counter,
	Legend,
	PlayerRole,
	SessionType,
	TeamType,
	ViewType
} from './../../+state';
import { AttendancesDay, AttendancesStore } from './../../+state/attendances-store/ngrx/attendances-store.model';
import { RootStoreState } from './../../+state/root-store.state';

@UntilDestroy()
@Component({
	templateUrl: 'attendances.component.html',
	styleUrls: ['attendances.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendancesComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
	readonly statsType: SelectItem[] = [
		{ value: SessionType.ALL, label: this.translate.instant('sidebar.sessiontype.all') },
		{ value: SessionType.INDIVIDUAL, label: this.translate.instant('sidebar.sessiontype.individual') },
		{ value: SessionType.TEAM, label: this.translate.instant('sidebar.sessiontype.team') }
	];
	readonly teamTypesList: SelectItem[] = [
		{ value: TeamType.PRIMARY, label: this.translate.instant('sidebar.teamtype.national') },
		{ value: TeamType.SECONDARY, label: this.translate.instant('sidebar.teamtype.club') }
	];

	today$: Observable<Date>;
	yearList$: Observable<SelectItem[]>;
	year$: Observable<number>;
	monthList$: Observable<SelectItem[]>;
	month$: Observable<number>;
	metricList$: Observable<SelectItem[]>;
	legend$: Observable<Legend[]>;
	days$: Observable<number[]>;
	dayNames$: Observable<string[]>;
	selectablePlayerRoles$: Observable<PlayerRole[]>;
	selectedPlayerRoles$: Observable<PlayerRole[]>;
	datePeriod$: Observable<[Date, Date]>;
	counter$: Observable<Counter>;
	attendances$: Observable<AttendancesStore[]>;
	tooltip$: Observable<string>;
	currentTeam$: Observable<Team>;
	metric$: Observable<string>;
	sessionType$: Observable<SessionType>;
	view$: Observable<ViewType>;
	viewIsActivityLog$: Observable<boolean>;
	viewIsStatistics$: Observable<boolean>;
	teamTypes$: Observable<TeamType[]>;
	isNationalClub$: Observable<boolean>;
	stats$: Observable<ChartData>;
	statsOptions$: Observable<ChartOptions>;
	ordered$: Observable<boolean>;
	labelled$: Observable<boolean>;

	rows$: Observable<(string | number)[][]>;

	@BlockUI('general') attendancesBlockUI: NgBlockUI;
	blockTemplate = IterproBlockTemplateComponent;

	@ViewChild('bodyEl', { static: false }) bodyEl: any;
	@ViewChild('daysEl', { static: false }) daysEl: any;
	@ViewChild('playersEl', { static: false }) playersEl: any;
	private prevBodyEl: any = null;

	constructor(
		private store$: Store<RootStoreState>,
		private translate: TranslateService,
		private confirmationService: ConfirmationService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private competitionService: CompetitionsConstantsService,
		private error: ErrorService
	) {
		this.updateDimensions = this.updateDimensions.bind(this);
		this.updateScroll = this.updateScroll.bind(this);
	}

	ngOnInit() {
		this.blockUiInterceptorService.disableInterceptor();
		moment().locale(this.translate.currentLang);

		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(first(), untilDestroyed(this))
			.subscribe(() => {
				// gereral
				this.isNationalClub$ = this.store$.select(AuthSelectors.selectIsNationalClub);

				this.view$ = this.store$.select(AttendancesStoreSelectors.selectView);
				this.viewIsActivityLog$ = this.store$.select(AttendancesStoreSelectors.selectViewIsActivityLog);
				this.viewIsStatistics$ = this.store$.select(AttendancesStoreSelectors.selectViewIsStatistics);
				this.counter$ = this.store$.select(AttendancesStoreSelectors.selectEventCounter);
				this.store$
					.select(AttendancesStoreSelectors.selectIsLoading)
					.pipe(withLatestFrom(this.view$), untilDestroyed(this))
					.subscribe({
						next: ([isLoading, viewType]) => {
							if (isLoading) {
								this.attendancesBlockUI.start(
									this.translate.instant(
										viewType === ViewType.ACTIVITY_LOG
											? 'spinner.attendances.activityLog'
											: 'spinner.attendances.statistics'
									)
								);
							} else {
								this.attendancesBlockUI.stop();
							}
						},
						error: (error: Error) => this.error.handleError(error)
					});
				// sidemenu activity log
				this.yearList$ = this.store$.select(AttendancesStoreSelectors.selectYearList);
				this.year$ = this.store$.select(AttendancesStoreSelectors.selectYear);

				this.monthList$ = this.store$.select(AttendancesStoreSelectors.selectMonthList(this.translate));
				this.month$ = this.store$.select(AttendancesStoreSelectors.selectMonth);
				// activity log
				this.legend$ = this.store$.select(AttendancesStoreSelectors.selectLegend).pipe(
					map(legend =>
						legend.map(l => ({
							label: l.label ? this.translate.instant(l.label) : '',
							attrs: l.attrs
						}))
					)
				);
				this.days$ = this.store$.select(AttendancesStoreSelectors.selectDays);
				this.dayNames$ = this.store$.select(AttendancesStoreSelectors.selectDayNames);
				this.attendances$ = this.store$.select(AttendancesStoreSelectors.selectAllAttendances);
				this.tooltip$ = this.store$.select(AttendancesStoreSelectors.selectTooltip);

				// stats table
				this.store$
					.select(AttendancesStoreSelectors.selectPlayersStats)
					.pipe(map(map => [...map.keys()].map(k => [k, ...Object.values(map.get(k))])))
					.subscribe();

				// sidemenu statistics
				this.metricList$ = this.store$.select(AttendancesStoreSelectors.selectMetrics).pipe(
					untilDestroyed(this),
					map(metrics =>
						metrics.map(x => ({
							label: this.translate.instant(x.value),
							value: x.value
						}))
					)
				);
				this.metric$ = this.store$.select(AttendancesStoreSelectors.selectMetric);

				this.datePeriod$ = this.store$.select(AttendancesStoreSelectors.selectDefaultDatePeriod);
				this.sessionType$ = this.store$.select(AttendancesStoreSelectors.selectSessionType);
				this.today$ = this.store$.select(AttendancesStoreSelectors.selectToday);
				// statistics
				this.selectablePlayerRoles$ = this.store$.select(AttendancesStoreSelectors.selectSelectableGroupStats);
				this.selectedPlayerRoles$ = this.store$.select(AttendancesStoreSelectors.selectSelectedGroupStats);

				this.teamTypes$ = this.store$.select(AttendancesStoreSelectors.selectTeamType);

				this.stats$ = this.store$.select(AttendancesStoreSelectors.selectAttendanceStats).pipe(
					untilDestroyed(this),
					map(data => ({
						...data,
						datasets: data.datasets.map(dataset => {
							const label = this.interpolateCompetition(dataset.label);
							return {
								...dataset,
								label
							};
						})
					}))
				);
				this.statsOptions$ = this.store$.select(AttendancesStoreSelectors.selectAttendanceStatsOptions);
				this.ordered$ = this.store$.select(AttendancesStoreSelectors.selectIsOrdered);
				this.labelled$ = this.store$.select(AttendancesStoreSelectors.selectIsLabelled);

				this.store$.dispatch(AttendancesStoreActions.componentInitialized());
			});
	}

	ngOnDestroy() {
		this.unbindEvents();
		this.store$.dispatch(AttendancesStoreActions.componentDestroyed());
		this.attendancesBlockUI.stop();
	}

	ngAfterViewInit() {
		this.initWinSizeBinding();
	}

	ngAfterViewChecked() {
		this.initWinSizeBinding();
	}

	handleMonthChangeAction(monthEvent: any) {
		this.store$.dispatch(AttendancesStoreActions.monthChanged({ month: monthEvent.value }));
	}

	handleYearChangeAction(yearEvent: any) {
		this.store$.dispatch(AttendancesStoreActions.yearChanged({ year: yearEvent.value }));
	}

	/**
	 * This function is called on hover event to get the tooltip for each day and each player to display the informartion with bullets
	 * @param day : contains all the information of a player's day activity.
	 */
	cellEnteredAction(day: AttendancesDay, playerName: string, dayNum: number) {
		this.store$.dispatch(AttendancesStoreActions.cellEntered({ day, playerName, dayNum }));
	}

	handleChangeTabAction({ index }: { index: ViewType }) {
		this.store$.dispatch(AttendancesStoreActions.viewChanged({ view: index }));
	}

	downloadReportAction() {
		this.store$.dispatch(AttendancesStoreActions.activityLogPdfReportRequested());
	}

	/**
	 * On click of Download csv option attendance data for each player for each day of month will get downloaded in csv format.
	 */
	downloadCsvAction() {
		this.store$.dispatch(AttendancesStoreActions.activityLogCsvReportRequested());
	}

	onChangePeriodDateAction(datePeriod: [Date, Date]) {
		if (!!datePeriod && datePeriod[1]) {
			this.store$.dispatch(AttendancesStoreActions.datePeriodChanged({ datePeriod }));
		}
	}

	onChangePlayersAction(selectedGroup: PlayerRole[]) {
		this.store$.dispatch(
			AttendancesStoreActions.playerGroupChanged({ selectedGroup: sortByName(selectedGroup, 'displayName') })
		);
	}

	onChangeMetricsAction(metric: string) {
		this.store$.dispatch(AttendancesStoreActions.metricChanged({ metric }));
	}

	onChangeTeamTypeAction(teamTypes: TeamType[]) {
		this.store$.dispatch(AttendancesStoreActions.teamTypesChanged({ teamTypes }));
	}

	onFilterStatsTypeAction({ value }: { value: SessionType }) {
		this.store$.dispatch(AttendancesStoreActions.sessionTypeChanged({ sessionType: value }));
	}

	// scroll & resize event management

	private initWinSizeBinding() {
		if (this.prevBodyEl !== this.bodyEl) {
			this.prevBodyEl = this.bodyEl;
			this.bindEvents();
		}
		this.updateDimensions();
	}

	private bindEvents() {
		if (this.hasTable()) {
			this.bodyEl.nativeElement.addEventListener('scroll', this.updateScroll);
		}
		window.addEventListener('resize', this.updateDimensions);
	}

	private unbindEvents() {
		if (this.hasTable()) {
			this.bodyEl.nativeElement.removeEventListener('resize', this.updateScroll);
		}
		window.removeEventListener('resize', this.updateDimensions);
	}

	private updateScroll() {
		if (!this.hasTable()) return;
		this.daysEl.nativeElement.scrollLeft = this.bodyEl.nativeElement.scrollLeft;
		this.playersEl.nativeElement.scrollTop = this.bodyEl.nativeElement.scrollTop;
	}

	private hasTable() {
		return this.bodyEl && this.bodyEl.nativeElement;
	}

	private hasHorizontalScrollbar() {
		if (!this.hasTable()) return false;
		return this.bodyEl.nativeElement.offsetWidth < this.bodyEl.nativeElement.scrollWidth;
	}

	private hasVerticalScrollbar() {
		if (!this.hasTable()) return false;
		return this.bodyEl.nativeElement.offsetHeight < this.bodyEl.nativeElement.scrollHeight;
	}

	private hasElements() {
		return this.daysEl && this.daysEl.nativeElement && this.playersEl && this.playersEl.nativeElement;
	}

	private updateDimensions() {
		if (!this.hasElements()) return;
		let marginRight = '0px';
		let paddingBottom = '0px';
		// TODO calculate scrollbar width/height
		if (this.hasVerticalScrollbar()) marginRight = '12px';
		if (this.hasHorizontalScrollbar()) paddingBottom = '12px';
		this.daysEl.nativeElement.style.marginRight = marginRight;
		this.playersEl.nativeElement.style.paddingBottom = paddingBottom;
	}
	// end of scroll & size manangement

	private interpolateCompetition(label: string): string {
		const competition = this.competitionService.getCompetitionFromJson(Number(label));
		return label
			? !!competition && competition.name !== 'NaN' && this.isValidNumber(competition.name) // this because we can have a String - the actual competition name, or a number - the provider id
				? competition.name
				: this.translate.instant(label)
			: 'No Competition';
	}

	private isValidNumber(value: unknown): boolean {
		return this.isFullNumber(value) ? isNaN(Number(value)) : true;
	}

	private isFullNumber(value: unknown): boolean {
		return Number.isInteger(Number(value)) && value !== null;
	}

	dayHeaderClicked(day: number) {
		this.confirmationService.confirm({
			message: this.translate.instant('attendance.redirectToDay'),
			header: 'Iterpro',
			accept: () => {
				this.store$.dispatch(AttendancesStoreActions.dayHeaderClicked({ day }));
			}
		});
	}
}
