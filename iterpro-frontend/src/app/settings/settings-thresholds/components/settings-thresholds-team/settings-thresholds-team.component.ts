import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	ComparePlayersStatsApi,
	Customer,
	Team,
	TeamApi,
	TeamSeason,
	Threshold
} from '@iterpro/shared/data-access/sdk';
import { ActionButtonsComponent, FormFeedbackComponent, SkeletonTableComponent } from '@iterpro/shared/ui/components';
import { ActiveThrFilterPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { Observable, combineLatest, distinctUntilChanged, filter, first, forkJoin, map, switchMap, tap } from 'rxjs';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { toThresholdFormElement } from './models/settings-thresholds-team.form';
import { Statistics, ThresholdFormElement } from './models/settings-thresholds-team.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-settings-thresholds-team',
	templateUrl: './settings-thresholds-team.component.html',
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		ActiveThrFilterPipe,
		TranslateModule,
		ActionButtonsComponent,
		PrimeNgModule,
		FormFeedbackComponent,
		SkeletonTableComponent,
		SettingsHeaderComponent
	],
	providers: [ActiveThrFilterPipe]
})
export class SettingsThresholdsTeamComponent extends EtlBaseInjectable implements CanComponentDeactivate, OnInit {
	// Services
	readonly #comparePlayersStatsService = inject(ComparePlayersStatsApi);
	readonly #error = inject(ErrorService);
	readonly #alertService = inject(AlertService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly #teamApi = inject(TeamApi);
	readonly #activeThrFilterPipe = inject(ActiveThrFilterPipe);

	readonly currentSeason$ = this.#authStore
		.select(AuthSelectors.selectTeamSeason)
		.pipe(takeUntilDestroyed(), distinctUntilChanged());
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	currentSeason: TeamSeason;

	currentTeam$ = this.#authStore.select(AuthSelectors.selectTeam).pipe(takeUntilDestroyed(), distinctUntilChanged());
	#currentTeam: Team;
	customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed(), distinctUntilChanged());

	#statistics: Statistics;
	#_thresholdsTeam: Array<Threshold>;

	thresholdsFormArray: FormArray<FormGroup<ThresholdFormElement>> = new FormArray<FormGroup<ThresholdFormElement>>([]);
	saveClicked = false;
	activeThresholdsMetrics: string[];
	isLoading = false;
	editMode = false;
	constructor(injector: Injector) {
		super(injector);
	}

	canDeactivate(): boolean {
		return !this.thresholdsFormArray.dirty;
	}

	ngOnInit() {
		this.isLoading = true;
		combineLatest([this.currentTeam$, this.currentSeason$, this.customer$])
			.pipe(
				filter(([team, season]: [Team, TeamSeason, Customer]) => !!team && !!season),
				map(([team, season, customer]: [Team, TeamSeason, Customer]) => {
					this.currentSeason = season;
					this.#currentTeam = {
						...team,
						_thresholdsTeam:
							!team._thresholdsTeam || team._thresholdsTeam.length === 0
								? this.etlTeamService.getDefaultThresholds()
								: team._thresholdsTeam
					};
					this.#_thresholdsTeam = this.#currentTeam._thresholdsTeam;
					this.activeThresholdsMetrics = getTeamSettings(
						customer.teamSettings,
						this.#currentTeam.id
					).metricsTeamTactical;
				}),
				tap(() => {
					if (!this.currentSeason) {
						this.#alertService.notify('error', 'navigator.profile', 'alert.noseasoncreated', false);
					}
				}),
				switchMap(() => this.getThresholdsStatistics())
			)
			.subscribe({
				next: () => {
					this.thresholdsFormArray.clear();
					this.loadForm();
					this.disableForm();
					this.isLoading = false;
				},
				error: (error: Error) => this.#error.handleError(error)
			});
	}

	private loadForm(): void {
		const filteredThresholds: Threshold[] = this.#activeThrFilterPipe.transform(
			this.#_thresholdsTeam,
			this.activeThresholdsMetrics
		);
		(filteredThresholds || []).forEach(threshold => {
			this.thresholdsFormArray.push(
				this.#fb.group(
					toThresholdFormElement(threshold, this.etlTeamService.getMetricLabel(threshold.name), this.#statistics)
				)
			);
		});
	}

	private disableForm(): void {
		if (!this.editMode) {
			this.thresholdsFormArray.disable();
		}
	}

	private getThresholdsStatistics(): Observable<void> {
		const thresholds = this.#currentTeam._thresholdsTeam.map(({ name }) => name.replace(/\./g, '_'));

		const last30 = this.#comparePlayersStatsService.compareTeamStats(
			this.#currentTeam.id,
			moment(this.getDay()).subtract(1, 'month').startOf('day').toString(),
			moment(this.getDay()).endOf('day').toString(),
			thresholds
		);

		const lastSeason = this.#comparePlayersStatsService.compareTeamStats(
			this.#currentTeam.id,
			this.currentSeason.offseason,
			this.currentSeason.inseasonEnd,
			thresholds
		);

		return this.#blockUiInterceptorService.disableOnce(forkJoin([last30, lastSeason])).pipe(
			map(([last30, lastSeason]) => {
				this.#statistics = {
					last30: last30 || {},
					lastSeason: lastSeason || {}
				};
			}),
			untilDestroyed(this)
		);
	}

	private getDay(): Date {
		const { offseason, inseasonEnd } = this.currentSeason;
		const day = moment().isBetween(offseason, inseasonEnd) ? moment().toDate() : inseasonEnd;
		return day;
	}

	edit(): void {
		this.editMode = true;
		this.thresholdsFormArray.enable();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.thresholdsFormArray.clear();
		this.thresholdsFormArray.markAsPristine();
		this.loadForm();
		this.disableForm();
	}

	private getThresholdToSave(): Threshold[] {
		const formValues = this.thresholdsFormArray.controls.map(control => control.value);
		return this.#currentTeam._thresholdsTeam.map((threshold: Threshold) => {
			const thresholdValue = formValues.find(formControlValue => formControlValue.name === threshold.name)?.value;
			if (!thresholdValue) {
				return threshold;
			}
			return {
				...threshold,
				value: thresholdValue
			};
		});
	}

	save(): void {
		this.saveClicked = true;
		if (!this.thresholdsFormArray.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.editMode = false;
		this.thresholdsFormArray.disable();
		this.thresholdsFormArray.markAsPristine();
		this.#currentTeam._thresholdsTeam = this.getThresholdToSave();
		this.#blockUiInterceptorService
			.disableOnce(
				this.#teamApi.patchAttributes(this.#currentTeam.id, {
					_thresholdsTeam: this.#currentTeam._thresholdsTeam
				})
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.#authStore.dispatch(
						AuthActions.performUpdateTeam({
							currentTeam: { team: this.#currentTeam, season: this.currentSeason }
						})
					);
					this.#alertService.notify('success', 'home.clubSettings', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#error.handleError(error)
			});
	}
}
