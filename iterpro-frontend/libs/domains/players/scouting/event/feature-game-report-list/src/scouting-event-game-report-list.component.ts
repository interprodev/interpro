import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScoutingEventGameReportComponent } from '@iterpro/players/scouting/event/feature-game-report';
import {
	AddGameReportActionModel,
	SandBoxGameReportService,
	ScoutingTeamSide
} from '@iterpro/players/scouting/event/sand-box';
import {
	PlayerToStartObserveInfo,
	Schema,
	ScoutingGame,
	ScoutingGameEssentialCustomer,
	ScoutingGameReportWithPlayer
} from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { SchemaConversionService } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, FormsModule, TranslateModule, ScoutingEventGameReportComponent, ArrayFromNumberPipe],
	selector: 'iterpro-scouting-event-game-report-list',
	templateUrl: './scouting-event-game-report-list.component.html',
	styleUrls: ['./scouting-event-game-report-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingEventGameReportListComponent implements OnChanges {
	@Input({required: true}) gameReportsAway!: ScoutingGameReportWithPlayer[];
	@Input({required: true}) gameReportsHome!: ScoutingGameReportWithPlayer[];
	@Input({required: true}) gameReportsWithPlayersNotCategorized!: ScoutingGameReportWithPlayer[];
	@Input({required: true}) homeTeamCrest!: string;
	@Input({required: true}) awayTeamCrest!: string;
	@Input({required: true}) isGameDataLoading!: boolean;
	@Input({required: true}) isLineUpLoading!: boolean;
	@Input({required: true}) currentScout!: ScoutingGameEssentialCustomer;
	@Input({required: true}) isScoutingAdmin!: boolean;
	@Input({required: true}) isEditable!: boolean;
	@Input({required: true}) gameData!: ScoutingGame;
	@Input({required: true}) homeScouts!: SelectItem[];
	@Input({required: true}) awayScouts!: SelectItem[];
	@Input({required: true}) homeAvailablePlayers!: SelectItem[];
	@Input({required: true}) awayAvailablePlayers!: SelectItem[];
	@Input({required: true}) clubId!: string;
	@Input({required: true}) gameReportTemplates!: Schema[];
	@Input({required: true}) isGameReportNotCategorized!: boolean;
	@Input({required: true}) isGameReportsLoading!: boolean;
	@Input({required: true}) isTeamSquadLoading!: boolean;
	@Input({required: true}) isTemplatesLoading!: boolean;
	@Input({required: true}) activeGameReportTemplate!: Schema;

	selectableGameReportsPlayersHome: PlayerToStartObserveInfo[] = [];
	selectableGameReportsPlayersAway: PlayerToStartObserveInfo[] = [];
	bothTeamsOptions!: SelectItem[];
	selectedScoutIdsHome!: string[];
	selectedScoutIdsAway!: string[];

	constructor(private sb: SandBoxGameReportService, private schemaConversionService: SchemaConversionService) {}

	ngOnChanges(changes: SimpleChanges) {
		if (this.isGameReportNotCategorized) {
			if (changes['gameData']) {
				this.bothTeamsOptions = [
					{
						value: this.gameData.thirdPartyProviderHomeTeamId,
						label: this.gameData.homeTeam
					},
					{
						value: this.gameData.thirdPartyProviderAwayTeamId,
						label: this.gameData.awayTeam
					}
				];
			}
		}
	}

	onClickAddGameReport(players: PlayerToStartObserveInfo[], teamName: string, side: ScoutingTeamSide) {
		let scoutIds: string[] = [];
		if (side === 'home') {
			this.selectableGameReportsPlayersHome = [];
			scoutIds = this.selectedScoutIdsHome || [];
		} else {
			this.selectableGameReportsPlayersAway = [];
			scoutIds = this.selectedScoutIdsAway || [];
		}
		const payload: AddGameReportActionModel = { scoutIds, players, teamName, side };
		this.sb.addGameReportClicked.next(payload);
	}
}
