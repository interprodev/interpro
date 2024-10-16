import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	InStatPlayer,
	InStatTeam,
	InstatApi,
	ParsedInStatPlayer,
	TableColumnBase,
	AlreadyImportedPlayer
} from '@iterpro/shared/data-access/sdk';
import { PlayerFlagComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { CompetitionsConstantsService, sortByName } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { finalize, first, map } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, TranslateModule, PrimeNgModule, PlayerFlagComponent],
	selector: 'iterpro-instat-player-search',
	templateUrl: './instat-player-search.component.html',
	styleUrls: ['./instat-player-search.component.scss']
})
export class InstatPlayerSearchComponent implements OnInit, OnDestroy {
	@Input() alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	@Input() selection!: 'single' | 'multiple';

	@Output() selectPlayersEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() discardEmitter: EventEmitter<any> = new EventEmitter<any>();

	loading = false;

	competitions: SelectItem[] = [];
	selectedCompetition!: string;

	teams: SelectItem[] = [];
	selectedTeam!: string;

	players: ParsedInStatPlayer[] = [];
	selectedPlayers: ParsedInStatPlayer[] = [];

	readonly cols: TableColumnBase[] = [
		{
			field: 'photo',
			header: '',
			sortable: false,
			width: '80px'
		},
		{
			field: 'name',
			header: 'name',
			sortable: true
		},
		{
			field: 'country1_name',
			header: 'profile.overview.nationality',
			align: 'center',
			sortable: true
		},
		{
			field: 'position',
			header: 'profile.position',
			sortable: true
		},
		{
			field: 'club_team_name',
			header: 'admin.evaluation.club',
			sortable: true
		},
		{
			field: 'alreadyImportedTeam',
			header: 'Scouting Team',
			sortable: true
		}
	];

	constructor(
		private competitionService: CompetitionsConstantsService,
		private instatApi: InstatApi,
		private currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.instatApi
			.getTeamsCompetitions(this.currentTeamService.getCurrentTeam().instatId)
			.pipe(
				untilDestroyed(this),
				first(),
				// map((competitions: any[]) =>
				// 	competitions.map(({ name: label, instId: value }: InStatTeam) => ({ label, value }))
				// ),
				finalize(() => {
					this.loading = false;
				})
			)
			.subscribe({
				next: (competitions: SelectItem[]) => {
					this.competitions = sortByName([...competitions, ...this.competitionService.getCompetitions()], 'name');
				},
				error: error => void console.error(error)
			});
	}

	ngOnDestroy(): void {}

	changeCompetition({ value: competitionId }: SelectItem) {
		this.players = [];
		if (Array.isArray(competitionId)) {
			this.teams = sortByName(
				competitionId.map(({ name: label, instatId: value }) => ({ label, value })),
				'name'
			);
		} else {
			this.loadCompetitionTeams(competitionId);
		}
	}

	private loadCompetitionTeams(competitionId: string) {
		this.loading = true;
		this.instatApi
			.instatCompetitionTeams(competitionId, null)
			.pipe(
				untilDestroyed(this),
				first(),
				map(({ teams }) => teams.map(({ name: label, instId: value }: InStatTeam) => ({ label, value }))),
				finalize(() => {
					this.loading = false;
				})
			)
			.subscribe({
				next: (teams: SelectItem[]) => {
					this.teams = sortByName(teams, 'name');
				},
				error: error => void console.error(error)
			});
	}

	changeTeam({ value: teamId }: SelectItem) {
		this.players = [];
		this.loading = true;
		this.instatApi
			.squadSeasonPlayers([Number(teamId)], 0)
			.pipe(
				untilDestroyed(this),
				first(),
				map(([{ players }]) => players.map((instatPlayer: InStatPlayer) => this.parseInstatPlayer(instatPlayer))),
				finalize(() => {
					this.loading = false;
				})
			)
			.subscribe({
				next: (players: ParsedInStatPlayer[]) => {
					this.players = sortByName(players, 'name');
				},
				error: error => void console.error(error)
			});
	}

	selectPlayers() {
		this.selectPlayersEmitter.emit(this.selectedPlayers);
	}

	discard() {
		this.discardEmitter.emit();
	}

	private parseInstatPlayer(instatPlayer: InStatPlayer): ParsedInStatPlayer {
		const alreadyImportedPlayer = this.alreadyImportedPlayers.find(
			({ providerId, teamName }) => providerId === Number(instatPlayer.instId)
		);
		return {
			...instatPlayer,
			name: `${instatPlayer.firstName} ${instatPlayer.lastName}`,
			alreadyImported: !!alreadyImportedPlayer,
			alreadyImportedTeam: alreadyImportedPlayer?.teamName,
			img: instatPlayer.imageDataURL,
			position: instatPlayer.role.code2,
			transferValue: '-',
			careerData: [],
			loaded: false // for additional info
		};
	}
}
