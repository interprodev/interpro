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
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerTeamSettings,
	GOScoreApi,
	Player,
	PlayerApi,
	Team,
	TeamGroup,
	TeamSeason,
	TeamSeasonApi,
	Threshold
} from '@iterpro/shared/data-access/sdk';
import { ActiveThrFilterPipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	ErrorService,
	ThresholdsService,
	getInvalidationThresholds,
	splitArrayInChunks,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SideTabComponent } from 'libs/shared/ui/components/src/lib/side-tabs/side-tab.component';
import { cloneDeep, sortBy } from 'lodash';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, forkJoin, from, of, combineLatest } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, first, map } from 'rxjs/operators';
import { ThresholdTestEmitterModel } from './components/threshold-test/threshold-test.component';
import {
	Apply,
	GpsThresholdSet,
	MetricThreshold,
	ThresholdActiveFormat,
	ThresholdCategory,
	ThresholdType,
	ThresholdsToUpdate
} from './interfaces';
import { ApplyThresholdsToCustomValueService } from './services/apply-thresholds-services/apply-thresholds-to-custom-value.service';
import { getPossibleGTCombination } from './services/utils';
import { IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

interface TestThreshold {
	tName: string;
	tMetric: string;
	tType: string;
}

type ApplyType = 'customValues' | 'thresholdType';

@UntilDestroy()
@Component({
	selector: 'iterpro-thresholds',
	templateUrl: './thresholds.component.html',
	styleUrls: ['./thresholds.component.css']
})
export class ThresholdComponent extends EtlBaseInjectable implements OnInit, OnChanges, OnDestroy {
	@Input() player: Player;
	@Input() players: Player[];
	@Input() user: Customer;
	@Input() editMode = false;
	@Input() discarded: boolean;
	@Input() admin: boolean;
	@Output() reloadPlayers: EventEmitter<void> = new EventEmitter<void>();

	downloadUrl: string;
	applyOptions: SelectItem[] = [];
	gdOptions: SelectItem[] = [];
	selectedApplies: Apply[] = [];
	currentTeam: Team;
	gpsPerDay: any[] = [];
	selectedGdType = 'GD';

	arrayThresholdChange: TestThreshold[];

	category: ThresholdCategory;
	samples: any[];
	currentSelectedTab: SideTabComponent = null;

	applyType: ApplyType = 'customValues';

	private tests: any[];
	private tactical: any[];
	private performance: any[] = [];
	private prevSelectedGdType = 'GD';
	private thresholdService: ThresholdsService;
	showPointToGpsAndTactical = true; // this is utils for debugging
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #currentSeason$ = this.authStore.select(AuthSelectors.selectTeamSeason).pipe(takeUntilDestroyed());
	#currentSeason: TeamSeason;
	constructor(
		private error: ErrorService,
		private playerApi: PlayerApi,
		private authStore: Store<AuthState>,
		private permissionsService: PermissionsService,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private goScoreService: GOScoreApi,
		private translate: TranslateService,
		private activeThrFilterPipe: ActiveThrFilterPipe,
		private teamSeasonApi: TeamSeasonApi,
		private applyThresholdsToCustomValueService: ApplyThresholdsToCustomValueService,
		injector: Injector
	) {
		super(injector);
		this.thresholdService = new ThresholdsService(injector);
	}

	ngOnDestroy() {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player'] && !changes['player'].firstChange && this.player) {
			this.init();
			if (this.players) {
				this.fillApplyOptions();
			}
		}
		if (changes['editMode'] && !changes['editMode'].firstChange) {
			if (changes['editMode'].currentValue === true) {
				this.saveThresholdsLocally(this.player);
			} else {
				if (changes['discarded'] && changes['discarded'].currentValue === true) {
					this.reloadLocalThresholds();
					this.discarded = false;
				} else {
					this.checkInvalidateGoScoreForPlayer();
					this.extractActiveThresholds();
				}
			}
		}
	}

	ngOnInit() {
		this.arrayThresholdChange = getInvalidationThresholds();
		combineLatest([this.#currentTeam$, this.#currentSeason$])
			.pipe(
				distinctUntilChanged(),
				filter(([team, season]) => !!team && !!season)
			)
			.subscribe({
				next: ([team, season]) => {
					this.currentTeam = team;
					this.#currentSeason = season;
					this.init();
				}
			});
	}

	private init() {
		this.downloadUrl = this.player.downloadUrl;
		if (!this.#currentSeason) {
			this.notificationService.notify('error', 'navigator.profile', 'alert.noseasoncreated', false);
		} else {
			this.teamSeasonApi
				.getGroups(this.#currentSeason.id, { order: 'name DESC' })
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: (results: TeamGroup[]) => {
						this.currentTeam = {
							...this.currentTeam,
							teamGroups: results,
							metricsTests: sortBy(this.currentTeam.metricsTests, ['testName', 'metricName'])
						};
						if (!this.admin) this.checkThresholdTestMissingMetrics(this.player);
						this.player._thresholdsTests = sortBy(this.player._thresholdsTests, ['name', 'metric']);

						this.checkForPlayerThresholds();
						this.extractActiveThresholds();
						this.fillApplyOptions();
						this.saveThresholdsLocally(this.player);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private checkThresholdTestMissingMetrics(player: Player) {
		const thresholdLabels = player._thresholdsTests.map(({ name, metric }) => name + ' - ' + metric);
		const missing = this.currentTeam.metricsTests.filter(({ metricLabel }) => thresholdLabels.indexOf(metricLabel) < 0);
		const missingThresholds = missing.map(({ testName, metricName }) => ({
			name: testName,
			customValue: 1,
			format: 'customValue',
			hidden: false,
			semaphoreType: null,
			intervals: null,
			metric: metricName
		}));
		player._thresholdsTests = player._thresholdsTests.concat(missingThresholds);
		if (missingThresholds && missingThresholds.length > 0) {
			this.notificationService.notify('info', 'navigator.profile', this.getMissingThresholdText(missingThresholds));
		}
	}

	private getMissingThresholdText(missingThresholds: any[] = []): string {
		const thresholdNames = missingThresholds
			.map(({ name, metric }) => `${name} - ${metric}`)
			.join(', ')
			.toUpperCase();
		const text = `${this.translate.instant('alert.missingThresholds')}: ${thresholdNames}. ${this.translate.instant(
			'alert.missingThresholds.doAction'
		)}`;
		return text;
	}

	isThresholdFormatSelected(thresholds: [], activeFormat: ThresholdActiveFormat): boolean {
		return thresholds && thresholds.every(({ format }) => format === activeFormat);
	}

	private getActiveThresholdFormat(format: ThresholdType): ThresholdActiveFormat {
		switch (format) {
			case 'gps':
				return this.gpsPerDay.find(({ format }) => format).format;
			case 'tactical':
				return this.player._thresholdsPlayer.find(({ format }) => format).format;
			default:
				console.debug('format not supported');
		}
	}

	selectThresholdValueType(format: ThresholdActiveFormat, type: ThresholdType) {
		if (this.editMode) {
			const thresholds: Record<ThresholdType, MetricThreshold[]> = {
				gps: this.gpsPerDay,
				tactical: this.player._thresholdsPlayer,
				test: this.player._thresholdsTests,
				financial: this.player._thresholdsFinancial
			};
			thresholds[type].forEach(threshold => {
				threshold.format = format;
			});
		}
	}

	private saveThresholdsLocally(player: Player) {
		this.tactical = cloneDeep(player._thresholdsPlayer);
		this.tests = cloneDeep(player._thresholdsTests);
	}

	private reloadLocalThresholds() {
		this.player._thresholdsPlayer = cloneDeep(this.tactical);
		this.player._thresholdsTests = cloneDeep(this.tests);
		this.gpsPerDay = cloneDeep(this.performance);
	}

	copyGpsThresholdToCustom(format: ThresholdActiveFormat) {
		const { metricsPerformance } = this.getTeamSettings(this.user);
		this.copyThresholdToCustomOrNotifyError(this.gpsPerDay, metricsPerformance, format);
	}

	copyTacticalThresholdToCustom(format: ThresholdActiveFormat) {
		const { metricsIndividualTactical } = this.getTeamSettings(this.user);
		this.copyThresholdToCustomOrNotifyError(this.player._thresholdsPlayer, metricsIndividualTactical, format);
	}

	private copyThresholdToCustomOrNotifyError(
		thresholdSource: MetricThreshold[],
		activeMetrics: string[],
		format: ThresholdActiveFormat
	) {
		if (!this.copyThresholdToCustom(thresholdSource, activeMetrics, format)) {
			this.notificationService.notify('error', 'navigator.profile', 'alert.noStatisticThresholds', false, null);
		}
	}

	private copyThresholdToCustom(
		thresholdSource: MetricThreshold[],
		activeMetrics: string[],
		format: ThresholdActiveFormat
	) {
		const validValues = thresholdSource.filter(
			threshold => !!threshold[format] && activeMetrics.includes(threshold.name.replace(/\./g, '_'))
		);
		validValues.forEach(threshold => {
			threshold.customValue = Number((threshold[format] || 0).toFixed(1));
		});
		return validValues.length > 0;
	}

	private extractActiveThresholds() {
		this.performance = [];
		this.gpsPerDay = this.thresholdService.getGpsThresholdsForDayType(this.selectedGdType, this.player._thresholds);
		this.gpsPerDay.forEach(x => (x.name = x.name.replace(/\./g, '_')));
		this.samples = this.activeThrFilterPipe.transform(
			this.gpsPerDay,
			this.getTeamSettings(this.user).metricsPerformance
		);
		this.performance = cloneDeep(this.gpsPerDay);
	}

	onApplyThresholdsConfirm(activeTab: SideTabComponent) {
		const message =
			this.applyType === 'customValues' ? 'confirm.applyThresholds.customValue' : 'confirm.applyThresholds.type';

		this.confirmationService.confirm({
			message: this.translate.instant(message),
			header: this.translate.instant('confirm.title'),
			accept: () => {
				this.onApplyThresholds(activeTab);
			}
		});
	}

	private onApplyThresholds({ tabKey }: SideTabComponent) {
		const thresholdType = tabKey.toLowerCase() as ThresholdType;
		const thresholdsToUpdate: ThresholdsToUpdate = this.getUpdatedThresholds(thresholdType);
		const labels: string[] = [];
		const players: Player[] = [];
		for (const apply of this.selectedApplies) {
			labels.push(apply.label);
			players.push(...this.getPlayersToUpdate(apply));
		}
		// @ts-ignore
		const httpResponses$: Array<Observable<any>> =
			this.applyType === 'customValues'
				? this.getApplyThresholdsToCustomValueHttpRequest(players, thresholdsToUpdate)
				: this.getApplyThresholdsTypeHttpRequest(players, thresholdType);

		forkJoin(httpResponses$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: res => {
					this.reloadPlayers.emit();
					this.notificationService.notify(
						'success',
						'navigator.profile',
						'alert.thresholdsUpdatedGroup',
						false,
						labels.join(', ')
					);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getApplyThresholdsTypeHttpRequest(players: Player[], type: ThresholdType) {
		return this.managePlayersHttpRequests(players, this.updateThresholdActiveFormat.bind(this), type).pipe(
			map(updatedPlayerIds => {
				this.triggerThresholdsUpdate(updatedPlayerIds);
				return updatedPlayerIds;
			})
		);
	}

	private updateThresholdActiveFormat(playerToUpdate: Player, type: ThresholdType): Observable<Player> {
		let thresholdField;
		switch (type) {
			case 'gps':
				thresholdField = '_thresholds';
				break;
			case 'tactical':
				thresholdField = '_thresholdsPlayer';
				break;
			case 'test':
				this.checkThresholdTestMissingMetrics(playerToUpdate);
				thresholdField = '_thresholdsTests';
				break;
		}
		let found;
		if (type === 'gps') {
			const currentPlayerGP = this.player[thresholdField].find(({ name }) => name === this.selectedGdType);
			playerToUpdate[thresholdField] = playerToUpdate[thresholdField].map(playerToUpdateGP => {
				if (playerToUpdateGP.name === currentPlayerGP.name) {
					return {
						...playerToUpdateGP,
						thresholds: playerToUpdateGP.thresholds
							.filter(thr => currentPlayerGP.thresholds.find(threshold => threshold.name === thr.name))
							.map(thr => {
								const currentPlayerThr = currentPlayerGP.thresholds.find(threshold => threshold.name === thr.name);
								if (!currentPlayerThr?.format) return thr;
								return {
									...thr,
									format: currentPlayerThr.format,
									semaphoreType: currentPlayerThr?.semaphoreType
								};
							})
					};
				}
				return playerToUpdateGP;
			});
		} else {
			this.player[thresholdField].forEach(({ name, metric, format, semaphoreType }) => {
				found = playerToUpdate[thresholdField].find(
					threshold => threshold.name === name && threshold.metric === metric
				);
				if (found) {
					found.format = format;
					found.semaphoreType = semaphoreType;
				}
			});
		}
		return this.playerApi.patchAttributes(playerToUpdate.id, playerToUpdate);
	}

	private getApplyThresholdsToCustomValueHttpRequest(players: Player[], thresholdsToUpdate: ThresholdsToUpdate) {
		const updateThresholdToCustomFunction = (
			thresholdsToUpdate.type === 'gps'
				? this.updatePlayerGpsThresholdToCustomValue
				: this.updatePlayerThresholdToCustomValue
		).bind(this);

		return this.managePlayersHttpRequests(players, updateThresholdToCustomFunction, thresholdsToUpdate);
	}

	private updatePlayerThresholdToCustomValue(
		playerToUpdate: Player,
		{ thresholds, thresholdFormat, type, category }: ThresholdsToUpdate
	) {
		const isTest = type === 'test';
		const isFinancial = type === 'financial';
		if (isTest) {
			this.checkThresholdTestMissingMetrics(playerToUpdate);
		}
		if (isFinancial) {
			playerToUpdate._thresholdsFinancial = this.completeWithMissingFinancialThresholds(
				playerToUpdate?._thresholdsFinancial
			);
			delete (<any>playerToUpdate)._id;
		}
		const targetThresholds = playerToUpdate[category];
		let formatValuePointer: ThresholdActiveFormat;
		thresholds.forEach((threshold: MetricThreshold) => {
			const targetThreshold = this.getSameThreshold(threshold, targetThresholds, type);
			if (targetThreshold) {
				if (isTest) {
					targetThreshold.intervals = threshold.intervals;
					if (!targetThreshold.format) {
						targetThreshold.format = 'customValue';
					}
				}
				formatValuePointer = isFinancial
					? 'value'
					: isTest
						? threshold.format
							? threshold.format
							: 'customValue'
						: thresholdFormat;
				if (this.isValidValue(threshold[formatValuePointer])) {
					targetThreshold[formatValuePointer] = Number((threshold[formatValuePointer] || 0).toFixed(1));
				}
			}
		});
		return this.playerApi.patchAttributes(playerToUpdate.id, playerToUpdate);
	}

	private updatePlayerGpsThresholdToCustomValue(
		playerToUpdate: Player,
		{ thresholds: sourceThresholds, thresholdFormat: sourceFormat }: ThresholdsToUpdate
	) {
		let targetThresholds: GpsThresholdSet = (playerToUpdate._thresholds || []).find(
			(gpsThreshold: GpsThresholdSet) => gpsThreshold.name === this.selectedGdType
		);
		if (!targetThresholds) {
			targetThresholds = {
				name: this.selectedGdType,
				thresholds: this.etlGpsService.getDefaultThresholds()
			};
			if (!playerToUpdate._thresholds) playerToUpdate._thresholds = [];
			playerToUpdate._thresholds.push(targetThresholds);
		}
		targetThresholds = {
			...targetThresholds,
			thresholds: targetThresholds.thresholds.filter(item => item !== null)
		};
		let targetThreshold: MetricThreshold;
		sourceThresholds.forEach(threshold => {
			targetThreshold = this.getSameThreshold(threshold, targetThresholds.thresholds as MetricThreshold[]);
			const format: ThresholdActiveFormat = !threshold.format ? threshold.format : sourceFormat;
			const customValue = Number((threshold[format] || 0).toFixed(1));
			if (targetThreshold) {
				targetThreshold.customValue = customValue;
			} else {
				console.warn('threshold not found, adding it', threshold, playerToUpdate.displayName);
				(playerToUpdate._thresholds || [])
					.find((gpsThreshold: GpsThresholdSet) => gpsThreshold.name === this.selectedGdType)
					.thresholds.push({
						...threshold,
						customValue
					});
			}
		});
		return this.playerApi.patchAttributes(playerToUpdate.id, playerToUpdate);
	}

	private getUpdatedThresholds(tabKey: ThresholdType): ThresholdsToUpdate {
		switch (tabKey) {
			case 'gps': {
				const format: ThresholdActiveFormat = this.getActiveThresholdFormat('gps');
				return this.applyThresholdsToCustomValueService.getUpdatedGpsThresholds(
					format,
					this.gpsPerDay,
					this.getTeamSettings(this.user)
				);
			}
			case 'tactical': {
				const format: ThresholdActiveFormat = this.getActiveThresholdFormat('tactical');
				return this.applyThresholdsToCustomValueService.getUpdatedTacticalThresholds(
					format,
					this.player,
					this.getTeamSettings(this.user)
				);
			}
			case 'test': {
				return this.applyThresholdsToCustomValueService.getUpdatedTestThresholds(this.player, this.currentTeam);
			}
			case 'financial': {
				return this.applyThresholdsToCustomValueService.getUpdatedFinancialThresholds(this.player);
			}
			default: {
				console.warn('tabKey not supported');
				return;
			}
		}
	}
	private getPlayersToUpdate({ type, key }: Apply) {
		const playersToUpdate: Player[] = [];

		switch (type) {
			case 'playerId': {
				const playerToUpdate = this.players.find(({ id }) => id.toString() === key.toString());
				if (playerToUpdate) {
					playersToUpdate.push(playerToUpdate);
				}
				break;
			}
			case 'group': {
				const playerIds = this.currentTeam.teamGroups.reduce(
					(accumulator, { name, players }) => (name === key ? accumulator.concat(players) : accumulator),
					[]
				);
				let playerToUpdate: Player;
				playerIds.forEach(playerId => {
					playerToUpdate = this.players.find(({ id }) => id.toString() === playerId.toString());
					if (playerToUpdate) {
						playersToUpdate.push(playerToUpdate);
					}
				});
				break;
			}
			case 'player':
			default: {
				playersToUpdate.push(this.player);
				break;
			}
		}
		return playersToUpdate;
	}

	private isValidValue(value: any): boolean {
		return [null, undefined].indexOf(value) < 0;
	}

	private getSameThreshold(
		threshold: MetricThreshold,
		targetThresholds: MetricThreshold[] = [],
		type: ThresholdType = 'gps'
	): MetricThreshold {
		const isTest = type === 'test';
		const compareKey = isTest ? `${threshold.name}_${threshold.metric}` : threshold.name;
		return targetThresholds.find(
			targetThreshold =>
				(isTest ? `${targetThreshold.name}_${targetThreshold.metric}` : targetThreshold.name) === compareKey
		);
	}

	private fillApplyOptions() {
		if (this.players) {
			this.applyOptions = [
				{ label: this.player.displayName, value: { type: 'player', label: this.player.displayName } },
				...this.currentTeam.teamGroups.map(({ name }) => ({
					label: name,
					value: { type: 'group', key: name, label: name }
				})),
				...this.players
					.filter(({ id }) => id !== this.player.id)
					.map(({ id, displayName }) => ({
						label: displayName,
						value: { type: 'playerId', key: id, label: displayName }
					}))
			];
			this.selectedApplies = [this.applyOptions[0].value];

			const possibleGdComb = getPossibleGTCombination();
			this.gdOptions = possibleGdComb.map(x => {
				const exists = this.existsGdType(x);
				return { label: x, value: x, exists };
			});
			this.selectedGdType = 'GD';
			this.prevSelectedGdType = this.selectedGdType;
		}
	}

	private checkForPlayerThresholds() {
		if (!this.player._thresholds || this.player._thresholds.length === 0) {
			const defaultThresholds: Threshold[] = this.etlGpsService.getDefaultThresholds();
			this.player._thresholds = [
				{ name: 'default', thresholds: defaultThresholds },
				{ name: 'GD', thresholds: defaultThresholds }
			];
		}

		let gpsThresholdSet: GpsThresholdSet;
		let thresholdsPerDay: Threshold[];
		const { metricsPerformance } = this.getTeamSettings(this.user);
		for (gpsThresholdSet of this.player._thresholds) {
			thresholdsPerDay = gpsThresholdSet.thresholds ? gpsThresholdSet.thresholds : [];
			for (const metricName of metricsPerformance) {
				const threshold = thresholdsPerDay.find(x => x.name === metricName);
				if (!threshold) {
					thresholdsPerDay.push(
						new Threshold({ name: metricName, value: 1, hidden: false, customValue: 1, format: 'customValue' })
					);
				}
			}
		}

		if (!this.player._thresholdsPlayer || this.player._thresholdsPlayer.length === 0) {
			const thresholdsPlayer = this.etlPlayerService
				.getDefaultThresholds()
				.map(threshold => ({ ...threshold, format: 'customValue' }));
			this.player._thresholdsPlayer = thresholdsPlayer;
		} else {
			this.player._thresholdsPlayer.forEach(threshold => {
				if (!this.isValidValue(threshold.customValue)) {
					threshold.customValue = threshold.value;
				}
			});
		}

		if (this.player._thresholdsTests) {
			this.player._thresholdsTests.forEach((threshold: MetricThreshold) => {
				if (!threshold.format) {
					threshold.format = 'customValue';
				}
			});
		}
		this.player._thresholdsFinancial = this.completeWithMissingFinancialThresholds(this.player._thresholdsFinancial);
	}

	private completeWithMissingFinancialThresholds(financialThresholds: Threshold[]): Threshold[] {
		const thresholdNames = ['Capital Loss', 'Capital Gain', 'Losses by Injuries', 'ROI'];
		const result = financialThresholds || [];
		for (const thrName of thresholdNames) {
			if (!result.map(({ name }) => name).includes(thrName)) {
				result.push(new Threshold({ name: thrName, value: 0, hidden: false, customValue: 0 }));
			}
		}
		return result;
	}

	private checkInvalidateGoScoreForPlayer() {
		const playerTempNewValues = {
			_thresholdsTests: this.tests
		};

		let changed = false;
		let thresholdNew;
		this.arrayThresholdChange.forEach(tInfo => {
			thresholdNew = null;
			const tType = tInfo.tType;
			const thresholdOld = this.player[tType]
				? this.player[tType].find(val => val.name === tInfo.tName && val.metric === tInfo.tMetric)
				: undefined;
			if (playerTempNewValues[tType])
				thresholdNew = playerTempNewValues[tType].find(val => val.name === tInfo.tName && val.metric === tInfo.tMetric);
			if (thresholdOld && thresholdNew && thresholdOld.value !== thresholdNew.value) {
				changed = true;
			}
		});

		if (changed) {
			this.goScoreService
				.updateAll({ playerId: this.player.id }, { dirty: true })
				.pipe(first(), untilDestroyed(this))
				.subscribe({ error: (error: Error) => this.error.handleError(error) });
		}
	}

	private existsGdType(gdType: string) {
		return this.thresholdService.hasGpsThresholdsForDayType(this.player._thresholds, gdType);
	}

	deleteSelectedGdType() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.deleteGDThresholds', {
				value: this.selectedGdType
			}),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-trash',
			accept: () => {
				this.player._thresholds = this.player._thresholds.filter(thr => thr.name !== this.selectedGdType);
				this.selectedGdType = this.player._thresholds.length ? this.player._thresholds[0] : null;
				this.prevSelectedGdType = this.selectedGdType;
				this.extractActiveThresholds();
				this.fillApplyOptions();
				this.checkForPlayerThresholds();
			}
		});
	}

	handleChangeGdType(event: SelectItem) {
		if (this.prevSelectedGdType !== this.selectedGdType) {
			let found = false;
			for (let tObj of this.player._thresholds) {
				if (tObj.name === this.prevSelectedGdType) {
					tObj = { name: this.prevSelectedGdType, thresholds: this.gpsPerDay };
					found = true;
					break;
				}
			}
			if (!found) {
				const tNewObj = {
					name: this.prevSelectedGdType,
					thresholds: this.gpsPerDay
				};
				this.player._thresholds.push(tNewObj);
			}
		}

		if (!this.thresholdService.hasGpsThresholdsForDayType(this.player._thresholds, this.selectedGdType)) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.createGDThresholds', {
					value: this.selectedGdType
				}),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					const thObj = this.thresholdService.getGpsThresholdsForDayType('default', this.player._thresholds);
					this.selectedGdType = event.value;
					this.player._thresholds.push({
						name: this.selectedGdType,
						thresholds: thObj
					});
					this.extractActiveThresholds();
					this.updateGdOptions(this.selectedGdType);
				},
				reject: () => {
					this.selectedGdType = this.prevSelectedGdType;
					this.extractActiveThresholds();
				}
			});
		} else {
			this.prevSelectedGdType = this.selectedGdType;
			this.extractActiveThresholds();
		}
	}

	private updateGdOptions(gdType: string) {
		this.gdOptions = this.gdOptions.map(o => (o.label === gdType ? { ...o, exists: true } : o));
	}

	saveThresholdTestDialog(event: ThresholdTestEmitterModel) {
		this.player._thresholdsTests[event.playerThresholdsTestsIndex] = event.dialogModel;
	}

	onChangeTab(tab: SideTabComponent) {
		this.currentSelectedTab = tab;
	}

	checkForQuestionMarkVisibilityTests(): boolean {
		if (!this.currentSelectedTab) return;
		const testTranslated: string = this.translate.instant('thresholds.category.test');
		return this.currentSelectedTab.tabTitle === testTranslated;
	}

	checkForQuestionMarkVisibilityFinancial(): boolean {
		if (!this.currentSelectedTab) return false;
		const financialTranslated: string = this.translate.instant('thresholds.category.financial');
		return this.currentSelectedTab.tabTitle === financialTranslated;
	}

	getTeamSettings(user: Customer): CustomerTeamSettings {
		return getTeamSettings(user.teamSettings, this.currentTeam.id);
	}

	// TODO: [IT-3838] abstract managePlayersHttpRequests() because it will be useful in a lot of scenarios
	private managePlayersHttpRequests(players: Player[], fn: (...args) => Observable<Player>, ...args: any[]) {
		const chunks: Player[][] = splitArrayInChunks<Player>(players, 5);
		return from(chunks).pipe(
			concatMap((chunk: Player[]) => (chunk.length > 0 ? forkJoin(chunk.map(player => fn(player, ...args))) : of([])))
		);
	}

	private triggerThresholdsUpdate(players: Player[]) {
		const updatedPlayerIds = [...new Set(players.map(({ id }) => id))];
		this.applyThresholdsToCustomValueService.triggerThresholdsUpdate(
			this.currentTeam.id,
			this.#currentSeason.id,
			updatedPlayerIds
		);
	}

	hasAccessToModule(moduleName: IterproUserPermission): boolean {
		return this.permissionsService.canUserAccessToModule(moduleName, this.currentTeam).response;
	}
}
