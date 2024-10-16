import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	inject
} from '@angular/core';
import { DeviceMetricDescriptor, Player, Team, TeamGroup } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';

import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import * as moment from 'moment';
import { SessionType } from 'src/app/+state';
import { SessionAnalysisStoreInterfaces } from 'src/app/+state/session-analysis-store';
import {
	AdvancedEnum,
	FiltersType,
	SessionsType,
	SplitSelectItem
} from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-period-filters',
	templateUrl: './period-filters.component.html',
	styleUrls: ['./period-filters.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodFiltersComponent implements OnInit, OnChanges {
	PERIOD_VIEWS = SessionAnalysisStoreInterfaces.PeriodAnalysis;
	today: Date = new Date();
	monthDates = [];

	@Input() periodAnalysisState: SessionAnalysisStoreInterfaces.PeriodAnalysis;
	@Input() selectedTeam: Team;
	@Input() playersOptions: SelectItem<Player | TeamGroup>[];
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() splits: SplitSelectItem[];
	@Input() selectedDatePeriod: Date[];
	@Input() selectedPlayersOptions: SelectItem<Player | TeamGroup>[];
	@Input() selectedMetrics: DeviceMetricDescriptor[];
	@Input() selectedFilter: FiltersType;
	@Input() selectedSessionType: SessionType;
	@Input() selectedSplits: SplitSelectItem[];
	@Input() periodGames: number;
	@Input() periodTrainings: number;

	@Input() advancedOptions: SelectItem<AdvancedEnum>[];
	@Input() selectedAdvanced: AdvancedEnum;
	@Input() advancedFlags: { inProgress: boolean; wrongSelection: boolean; noData: boolean };
	@Input() canLoadAdvanced: boolean;

	filtersOptions: SelectItem<number>[];
	sessionOptions: SelectItem<number>[];
	players: (Player | TeamGroup)[];
	selectedPlayers: (Player | TeamGroup)[];

	@Output() onSelectPeriod = new EventEmitter<Date[]>();
	@Output() onSelectPlayers = new EventEmitter<(Player | TeamGroup)[]>();
	@Output() onSelectFilter = new EventEmitter<FiltersType>();
	@Output() onSelectSessionType = new EventEmitter<SessionsType>();
	@Output() onSelectMetrics = new EventEmitter<DeviceMetricDescriptor[]>();
	@Output() onSelectSplits = new EventEmitter<SelectItem<string>[]>();
	@Output() onSelectAdvanced = new EventEmitter<AdvancedEnum>();

	partecipants: SelectItem<Player | TeamGroup>[];

	readonly #permissionsService = inject(PermissionsService);
	readonly #translateService = inject(TranslateService);

	ngOnInit(): void {
		this.filtersOptions = this._setFiltersOptions();
		this.sessionOptions = this._setSessionOptions();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.filtersOptions = this._setFiltersOptions();
		this.sessionOptions = this._setSessionOptions();

		if (changes.playersOptions) {
			if (this.hasPartecipantsChanged(changes.playersOptions.currentValue, changes.playersOptions.previousValue)) {
				this.partecipants = this.playersOptions;
			}
		}
	}

	onChangePeriod(_: Date): void {
		if (this.selectedDatePeriod.every(date => !!date)) {
			this.onSelectPeriod.emit(this.selectedDatePeriod);
		}
	}

	onChangeMetrics(metrics: any): void {
		this.onSelectMetrics.emit(metrics?.value as DeviceMetricDescriptor[]);
	}

	onChangePlayers(event: any): void {
		const selectItems: SelectItem<Player | TeamGroup>[] = event?.value;
		this.onSelectPlayers.emit(selectItems.map(({ value }) => value));
	}

	onChangeSplit(splits: any): void {
		this.onSelectSplits.emit(splits?.value as SplitSelectItem[]);
	}

	onChangeSessionType(item: any): void {
		this.onSelectSessionType.emit(item?.value as SessionsType);
	}

	onChangeFilter(filter: any): void {
		this.onSelectFilter.emit(filter?.value as FiltersType);
	}

	onChangeAdvanced(advancedOption: AdvancedEnum): void {
		this.onSelectAdvanced.emit(advancedOption);
	}

	dayHasSession(day): boolean {
		return this.monthDates.includes(day);
	}

	private hasPartecipantsChanged(
		currentPlayers: SelectItem<Player | TeamGroup>[],
		previousPlayers: SelectItem<Player | TeamGroup>[]
	): boolean {
		const currentIds: number[] = currentPlayers ? currentPlayers.map(({ value }) => value.id) : [];
		const previousIds: number[] = previousPlayers ? previousPlayers.map(({ value }) => value.id) : [];
		const sameIds: boolean = currentIds.every((id, index) => id === previousIds[index]);
		return !sameIds;
	}

	private _setFiltersOptions(): SelectItem<number>[] {
		const values: number[] = Object.keys(FiltersType)
			.filter(v => !isNaN(Number(v)))
			.map(v => Number(v));
		const labels: string[] = Object.keys(FiltersType).filter(v => isNaN(Number(v)));
		return labels.map((label, index) => ({
			label: this.#translateService.instant(`sessionAnalysis.options.${label.toLowerCase()}`),
			value: values[index]
		}));
	}

	private _setSessionOptions(): SelectItem<number>[] {
		const values: number[] = Object.keys(SessionType)
			.filter(v => !isNaN(Number(v)))
			.map(v => Number(v));
		const labels: string[] = Object.keys(SessionType).filter(v => isNaN(Number(v)));
		return labels.map((label, index) => ({
			label: this.#translateService.instant(`sidebar.sessiontype.${label.toLowerCase()}`),
			value: values[index]
		}));
	}

	get periodDays(): number {
		return moment(this.selectedDatePeriod[1]).diff(this.selectedDatePeriod[0], 'days') + 1;
	}

	get canAccessToModule(): boolean {
		return this.#permissionsService.canTeamAccessToModule('ewma', this.selectedTeam).response;
	}

	get moduleError(): string {
		return this.#permissionsService.canTeamAccessToModule('ewma', this.selectedTeam).error;
	}
}
