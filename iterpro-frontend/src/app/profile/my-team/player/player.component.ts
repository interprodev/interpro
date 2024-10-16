import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { Customer, Player, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-player',
	templateUrl: './player.component.html',
	styleUrls: ['./player.component.css']
})
export class PlayerComponent {
	@Input() activeIndex = 0;
	@Input() player: Player;
	@Input() players: Player[];
	@Input() editMode: boolean;
	@Input() user: any;
	@Input() discarded: boolean;
	@Input() attributesEdit: boolean;
	@Input() seasons: TeamSeason[];
	@Input() team: Team;
	@Input() sportType: string;
	@Input() hideDisabledModules: boolean;

	@Output() onSavePlayer: EventEmitter<any> = new EventEmitter<any>();
	@Output() tabChangeEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() addedNewEntry: EventEmitter<any> = new EventEmitter<any>();
	@Output() reloadPlayers: EventEmitter<void> = new EventEmitter<void>();

	trueVal = false;
	customers: Customer[];

	readonly #permissionsService = inject(PermissionsService);
	readonly #currentTeamService = inject(CurrentTeamService);

	savePlayer(updatedPlayer: Player) {
		this.player = updatedPlayer;
		this.onSavePlayer.emit(updatedPlayer);
	}

	onTabChange(event) {
		this.activeIndex = event.index;
		this.tabChangeEmitter.emit(event);
	}

	canAccessToModule(module: IterproUserPermission) {
		return this.#permissionsService.canUserAccessToModule(module, this.#currentTeamService.getCurrentTeam());
	}
}
