import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrillFilters, DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import {
	DrillStatsFilters,
	DrillStatsValues,
	DrillsStatsFacade,
	initialFilters
} from '@iterpro/manager/drills/stats/data-access';
import { DRILL_STATS_METRICS } from '@iterpro/manager/drills/stats/utils';
import { DrillsFiltersComponent } from '@iterpro/manager/drills/ui';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Drill, Player } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	DrillsListMapping,
	DrillsMapping, DrillsMappingService,
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment/moment';
import { SelectItem } from 'primeng/api';
import { distinctUntilChanged, startWith } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, FormsModule, ReactiveFormsModule, DrillsFiltersComponent],
	selector: 'iterpro-drills-stats-feature-filters',
	templateUrl: './drills-stats-feature-filters.component.html'
})
export class DrillsStatsFeatureFiltersComponent implements OnInit, OnChanges {
	@Input() drillStatsValues!: DrillStatsValues | undefined;
	@Input({ required: true }) players!: Partial<Player>[] | undefined;
	@Input({ required: true }) drills!: Drill[] | undefined;

	drillsBackup!: Drill[] | undefined;
	metrics: SelectItem<string>[];
	maxDate: Date = new Date();
	filtersForm: FormGroup = new FormGroup({});
	showDrillAdvancedFilters = false;

	// ADVANCED
	drillFiltersConfig: DrillFiltersConfig[] = [
		'theme',
		'duration',
		'numberOfPlayers',
		'pitchSize',
		'ageGroup',
		'technicalGoal',
		'tacticalGoal',
		'physicalGoal',
		'attachments'
	];
	drillsMapping!: DrillsMapping;
	drillFiltersListMapping!: DrillsListMapping;
	legendConfig: string[];

	readonly #facade = inject(DrillsStatsFacade);

	constructor(
		private fb: FormBuilder,
		private translate: TranslateService,
		private drillMappingService: DrillsMappingService,
		private currentTeamService: CurrentTeamService
	) {
		this.metrics = DRILL_STATS_METRICS.map(metric => ({
			label: this.translate.instant(metric.label as string),
			value: metric.value
		}));
		this.legendConfig = DRILL_STATS_METRICS.map(({ label }) => this.translate.instant(label + '.info'));
	}

	ngOnInit(): void {
		this._initForm();
		this._listenForChanges();
		if (this.metrics && this.metrics.length > 0) {
			this.filtersForm.get('metric')?.setValue(this.metrics[0].value);
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if ('drills' in changes) this._getDrillsMapping();
		if ('drills' in changes && this.drills && this.drills.length > 0) {
			const allDrillIds = this.drills?.map(drill => drill.id); 
			this.filtersForm.get('drillsIds')?.setValue(allDrillIds);
		}
	}

	applyDrillFilters(event: DrillFilters): void {
		const pitchSizeLabel: string = this.translate.instant('drills.pitchSize.width');
		const pitchSizeLengthLabel: string = this.translate.instant('drills.pitchSize.length');
		this.drills = this.drillMappingService.applyDrillFilters(event, this.drillsBackup as Drill[]);
	}

	private _initForm(): void {
		this.filtersForm = this.fb.group({
			datePeriod: [initialFilters.datePeriod, Validators.required],
			drillsIds: [[], Validators.required],
			players: [this.players || initialFilters.players, Validators.required],
			drillType: [Boolean(initialFilters.drillType), Validators.required],
			metric: [null, Validators.required]
		});
	}

	private _listenForChanges(): void {
		this.filtersForm.valueChanges
			.pipe(untilDestroyed(this), distinctUntilChanged(), startWith(this.filtersForm.value))
			.subscribe((result: DrillStatsFilters) => {
				this._checkValidators(result);
				const formValues = this.filtersForm.getRawValue();
				const newFilters = {
					...formValues,
					datePeriod: [
						formValues.datePeriod[0] ? moment(formValues.datePeriod[0]).startOf('day') : null,
						formValues.datePeriod[1] ? moment(formValues.datePeriod[1]).endOf('day') : null
					]
				};

				this.#facade.updateFilters(newFilters);
			});
	}

	private _checkValidators(result: DrillStatsFilters): void {
		if (result.drillsIds?.length) {
			this.filtersForm.get('players')?.enable({ emitEvent: false });
			this.filtersForm.get('drillType')?.enable({ emitEvent: false });
		} else {
			this.filtersForm.get('players')?.disable({ emitEvent: false });
			this.filtersForm.get('drillType')?.disable({ emitEvent: false });
		}
	}

	private _getDrillsMapping(): void {
		this.drillsMapping = this.drillMappingService.getDrillsMapping(this.currentTeamService.getCurrentTeam());
		this.drillFiltersListMapping = this.drillMappingService.getDrillFiltersListMapping(this.drills as Drill[], this.drillsMapping.themes);
		this.drillsBackup = cloneDeep(this.drills);
	}
}
