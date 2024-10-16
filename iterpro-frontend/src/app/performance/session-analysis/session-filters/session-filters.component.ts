import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import { DeviceMetricDescriptor, Event, Player, Team, TeamGroup, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { SelectItem } from 'primeng/api';
import { SessionAnalysisStoreInterfaces } from './../../../+state/session-analysis-store';
import {
	AdvancedEnum,
	BubbleMetrics,
	ChartFlags,
	FiltersType,
	SplitSelectItem
} from './../../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-session-filters',
	templateUrl: './session-filters.component.html',
	styleUrls: ['./session-filters.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionFiltersComponent implements OnInit, OnChanges {
	SESSION_VIEWS = SessionAnalysisStoreInterfaces.SessionAnalysis;
	filtersOptions: SelectItem<number>[];
	autoDisplayFirstSession = true;
	queryParamsChecked = false;

	@Input() sessionAnalysisState: SessionAnalysisStoreInterfaces.SessionAnalysis;
	@Input() teamSeasons: TeamSeason[];
	@Input() sessions: Event[];
	@Input() selectedSession: Event;
	@Input() selectedSessionDuration: number;
	@Input() selectedSessionGDType: string;
	@Input() playersOptions: SelectItem<Player | TeamGroup>[];
	@Input() playersInSession: Player[];
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() splits: SplitSelectItem[];
	@Input() selectedTeam: Team;
	@Input() selectedSeason: TeamSeason;
	@Input() selectedPlayersOptions: SelectItem<Player | TeamGroup>[];
	@Input() selectedFilter: SelectItem<FiltersType>;
	@Input() selectedMetrics: DeviceMetricDescriptor[];
	@Input() selectedTeamSplit: SplitSelectItem;
	@Input() selectedIndividualPlayer: Player;
	@Input() selectedIndividualSplits: SplitSelectItem[];
	@Input() bubbleMetrics: BubbleMetrics;
	@Input() chartFlags: ChartFlags;
	@Input() advancedOptions: SelectItem<AdvancedEnum>[];
	@Input() selectedAdvanced: AdvancedEnum;
	@Input() advancedFlags: { inProgress: boolean; wrongSelection: boolean; noData: boolean };
	@Input() canLoadAdvanced: boolean;

	@Output() onSelectSeason = new EventEmitter<TeamSeason>();
	@Output() onSelectSession = new EventEmitter<Event>();
	@Output() onSelectMetrics = new EventEmitter<DeviceMetricDescriptor[]>();
	@Output() onSelectTeamPlayers = new EventEmitter<(Player | TeamGroup)[]>();
	@Output() onSelectIndividualPlayer = new EventEmitter<Player>();
	@Output() onSelectFilter = new EventEmitter<FiltersType>();
	@Output() onSelectTeamSplit = new EventEmitter<SessionAnalysisStoreInterfaces.SplitSelectItem>();
	@Output() onSelectIndividualSplits = new EventEmitter<SessionAnalysisStoreInterfaces.SplitSelectItem[]>();
	@Output() onSelectPlayerIndividual = new EventEmitter<Player>();
	@Output() onSelectMetricBubble = new EventEmitter<BubbleMetrics>();
	@Output() onSelectAdvanced = new EventEmitter<AdvancedEnum>();

	partecipants: SelectItem<Player | TeamGroup>[];

	constructor(
		private readonly permissionsService: PermissionsService,
		private readonly translateService: TranslateService,
		private readonly route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.filtersOptions = this.setFiltersOptions();
		this.checkQueryParams();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.filtersOptions = this.setFiltersOptions();

		if (changes.playersOptions) {
			if (this.hasPartecipantsChanged(changes.playersOptions.currentValue, changes.playersOptions.previousValue)) {
				this.partecipants = this.playersOptions;
			}
		}

		this.checkQueryParams();

		if ('bubbleMetrics' in changes) {
			this.bubbleMetrics = Object.assign({}, this.bubbleMetrics);
		}
	}

	private checkQueryParams(): void {
		const sessionID: string = this.route.snapshot.params['session_id'];
		const playerId: string = this.route.snapshot.params['player_id'];
		const notificationDate: string = this.route.snapshot.params['date'];
		const ewma: boolean = this.route.snapshot.params['ewma'];

		if (!this.queryParamsChecked && !!this.sessions && this.sessions.length > 0) {
			if (sessionID) {
				this.autoDisplayFirstSession = false;
				this.selectedSession = this.sessions.find(s => s.id === sessionID);
			}

			if (notificationDate) {
				this.autoDisplayFirstSession = false;
				const filteredSessions: Event[] = this.sessions.filter(x =>
					moment(x.start).isBefore(moment(notificationDate), 'day')
				);

				/** If a player is selected, display the last session of that player */
				if (playerId) {
					const playerSessions: Event[] = filteredSessions.filter(x => x.playerIds.includes(playerId));
					this.selectedSession = playerSessions ? playerSessions[0] : filteredSessions[0];
				} else {
					/** If no player is selected, display the last session of the team */
					this.selectedSession = filteredSessions[0];
				}
			}

			/** Select Session and EWMA */
			if (!!this.selectedSession) this.onSelectSession.emit(this.selectedSession);
			if (ewma) this.onSelectAdvanced.emit(AdvancedEnum['AL/CL EWMA']);

			/** Set to true to avoid the query params check on every ngChanges */
			this.queryParamsChecked = true;
		}
	}

	onChangeSeason(event: any): void {
		this.onSelectSeason.emit(event?.value as TeamSeason);
	}

	onChangeSession(item: any): void {
		if (item?.value) this.onSelectSession.emit(item?.value as Event);
	}

	onChangeMetrics(event: any): void {
		this.onSelectMetrics.emit(event?.value as DeviceMetricDescriptor[]);
	}

	onChangePlayers(event: any): void {
		const selectItems: SelectItem<Player | TeamGroup>[] = event?.value;
		this.onSelectTeamPlayers.emit(selectItems.map(({ value }) => value));
	}

	onChangeIndividualPlayer(playerId: string): void {
		this.selectedIndividualPlayer = this.playersInSession.find(({ id }) => id === playerId);
		this.onSelectIndividualPlayer.emit(this.selectedIndividualPlayer);
	}

	onChangeFilter(filter: any): void {
		this.onSelectFilter.emit(filter?.value as FiltersType);
	}

	onChangeSplit(splits: any): void {
		this.sessionAnalysisState === SessionAnalysisStoreInterfaces.SessionAnalysis.Team
			? this.onSelectTeamSplit.emit(splits?.value as SessionAnalysisStoreInterfaces.SplitSelectItem)
			: this.onSelectIndividualSplits.emit(splits?.value as SessionAnalysisStoreInterfaces.SplitSelectItem[]);
	}

	onChangeBubbleMetrics(e: any, type: 'xAxis' | 'yAxis' | 'size'): void {
		this.bubbleMetrics[type] = e.value as DeviceMetricDescriptor;
		this.onSelectMetricBubble.emit(this.bubbleMetrics);
	}

	onChangeAdvanced(advancedOption: any): void {
		this.onSelectAdvanced.emit(advancedOption?.value as AdvancedEnum);
	}

	private hasPartecipantsChanged(
		currentPlayers: SelectItem<Player | TeamGroup>[],
		previousPlayers: SelectItem<Player | TeamGroup>[]
	): boolean {
		const currentIds: number[] = currentPlayers ? currentPlayers.map(({ value }) => value.id) : [];
		const previousIds: number[] = previousPlayers ? previousPlayers.map(({ value }) => value.id) : [];
		const isSame: boolean =
			currentIds.length === previousIds.length && currentIds.every((id, index) => id === previousIds[index]);
		return !isSame;
	}

	private setFiltersOptions(): SelectItem<number>[] {
		const values: number[] = Object.keys(FiltersType)
			.filter(v => !isNaN(Number(v)))
			.map(v => Number(v));
		const labels: string[] = Object.keys(FiltersType).filter(v => isNaN(Number(v)));
		return labels.map((label, index) => ({
			label: this.translateService.instant(`sessionAnalysis.options.${label.toLowerCase()}`),
			value: values[index]
		}));
	}

	get canAccessToModule(): boolean {
		return this.permissionsService.canTeamAccessToModule('ewma', this.selectedTeam).response;
	}

	get moduleError(): string {
		return this.permissionsService.canTeamAccessToModule('ewma', this.selectedTeam).error;
	}
}
