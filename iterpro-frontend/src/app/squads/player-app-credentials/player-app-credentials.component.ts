import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CustomerPlayer, CustomerPlayerApi, Player, PlayerApi, Team, TeamApi } from '@iterpro/shared/data-access/sdk';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface DialogPlayer extends Player {
	enabled: boolean;
	changed: boolean;
	reset: boolean;
}

@UntilDestroy()
@Component({
	selector: 'iterpro-player-app-credentials',
	templateUrl: './player-app-credentials.component.html',
	styleUrls: ['./player-app-credentials.component.css']
})
export class PlayerAppCredentialsComponent implements OnInit {
	@Input() visible = false;
	@Input() teams: Team[];
	@Input() selectedTeam: Team;

	@Output() onClose: EventEmitter<Player | void> = new EventEmitter<Player | void>();

	players: DialogPlayer[] = [];
	customerPlayers: CustomerPlayer[] = [];

	teamPlayersOptions: SelectItem[];

	isLoading = true;

	constructor(
		private teamApi: TeamApi,
		private playerApi: PlayerApi,
		private customerPlayerApi: CustomerPlayerApi,
		private error: ErrorService
	) {}

	ngOnInit() {
		this.onSelectTeam();
	}

	close(player?: DialogPlayer) {
		this.visible = false;
		this.onClose.emit(player);
	}

	onSelectTeam() {
		this.isLoading = true;
		this.getPlayers(this.selectedTeam)
			.pipe(untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error),
				complete: () => (this.isLoading = false)
			});
	}

	private getPlayers(team: Team): Observable<Player[]> {
		return this.teamApi
			.getPlayers(team.id, { fields: ['id', 'displayName', 'email', 'customerPlayer'], include: 'customerPlayer' })
			.pipe(
				map(
					(players: Player[]) =>
						(this.players = sortBy(
							players.map(player => ({ ...player, enabled: !!player.customerPlayer, changed: false, reset: false })),
							'displayName'
						))
				)
			);
	}

	areAllEnabled(): boolean {
		return this.players.filter(({ enabled, email }) => enabled || email).every(({ enabled }) => enabled);
	}

	toggleAllEnabled(value: boolean) {
		this.players = this.players.map(player => {
			const newEnabledValue: boolean = value && !!player.email;
			return { ...player, enabled: newEnabledValue, changed: player.changed !== newEnabledValue };
		});
	}

	toggleChangeStatus(player: DialogPlayer) {
		player.changed = !player.changed;
		// if (!player.enabled) player.reset = false;
	}

	// toggleChangeReset(player: DialogPlayer, value: boolean) {
	// 	player.reset = value;
	// 	if (value && !player.changed) player.changed = true;
	// }

	cannotBeEnabled(player: DialogPlayer): boolean {
		return !player.enabled && (!player.email || this.hasReachedTheLimit());
	}

	getAvailableSeats(): number {
		return this.players.filter(({ enabled }) => enabled).length;
	}

	getTeamPlayerLimit(): number {
		return this.selectedTeam?.playerAppLimit || 30;
	}

	hasReachedTheLimit(): boolean {
		return (this.players.filter(({ customerPlayer }) => customerPlayer) || []).length >= this.getTeamPlayerLimit();
	}

	isConfirmDisabled(): boolean {
		return this.players.filter(({ changed }) => changed).length === 0;
	}

	onClickPlayer(player: DialogPlayer) {
		this.close(player);
	}

	saveChanges() {
		this.isLoading = true;
		const changed = this.players.filter(({ changed }) => changed);
		const toRemove = changed.filter(({ enabled, customerPlayer }) => !enabled && !!customerPlayer);
		const toAdd = changed.filter(({ enabled, customerPlayer }) => enabled && !customerPlayer);
		const toReset = changed.filter(({ enabled, reset, customerPlayer }) => enabled && customerPlayer && reset);
		const toRemove$ = toRemove.map(player => this.playerApi.deletePlayerAppCredentials(player.id));
		const toAdd$ = toAdd.map(player => this.playerApi.createPlayerAppCredentials(player.id));
		// const toReset$ = toReset.map(player => this.customerPlayerApi.resetPlayerAppCredentials(player.id));
		if (toRemove$.length === 0 && toAdd$.length === 0) {
			this.isLoading = false;
			this.close();
			return;
		}
		forkJoin([...toRemove$, ...toAdd$])
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.isLoading = false;
					this.close();
				},
				error: (error: Error) => {
					this.isLoading = false;
					this.error.handleError(error);
				}
			});
	}
}
