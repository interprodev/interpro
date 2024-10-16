import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Player, TeamGroup, TeamSeason, TeamSeasonApi } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	PictureComponent,
	SkeletonDropdownComponent,
	SkeletonPicklistComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep, sortBy } from 'lodash';
import { ConfirmationService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { forkJoin, map, tap } from 'rxjs';
import { SettingsStore } from 'src/app/settings/+state/settings.store';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { SettingsTeamsDropdownComponent } from '../settings-teams-dropdown/settings-teams-dropdown.component';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-teams-player-groups',
	templateUrl: 'settings-teams-player-groups.component.html',
	imports: [
		ActionButtonsComponent,
		FormsModule,
		TranslateModule,
		PictureComponent,
		SkeletonPicklistComponent,
		SkeletonModule,
		SkeletonDropdownComponent,
		PrimeNgModule,
		SettingsHeaderComponent,
		SettingsTeamsDropdownComponent
	]
})
export class SettingsTeamsPlayerGroupsComponent implements CanComponentDeactivate {
	// Services
	readonly #errorService = inject(ErrorService);
	readonly #settingsStore = inject(SettingsStore);
	readonly #teamSeasonApi = inject(TeamSeasonApi);
	readonly #alertService = inject(AlertService);
	readonly #translate = inject(TranslateService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	#selectedTeamSeason: TeamSeason;
	groups: TeamGroup[];
	selectedGroup: TeamGroup;
	groupBackup: TeamGroup;

	players: Player[] = [];
	activePlayers: Player[] = [];
	selectedPlayers: Player[] = [];
	isLoading = true;
	editMode = false;
	constructor() {
		effect(() => {
			if (this.#settingsStore.selectedTeamSeason()) {
				this.isLoading = true;
				this.#selectedTeamSeason = this.#settingsStore.selectedTeamSeason();
				this.init();
			}
		});
	}

	canDeactivate(): boolean {
		return !this.editMode || !this.hasChanges();
	}

	hasChanges(): boolean {
		return (
			JSON.stringify(this.selectedGroup) !== JSON.stringify(this.groupBackup) ||
			this.selectedPlayers?.length !== this.selectedGroup?.players?.length
		);
	}

	private init(): void {
		this.#blockUiInterceptorService
			.disableOnce(
				forkJoin([
					this.#teamSeasonApi.getPlayers(this.#selectedTeamSeason.id, { fields: ['id', 'displayName', 'downloadUrl'] }),
					this.#teamSeasonApi.getGroups(this.#selectedTeamSeason.id)
				])
			)
			.pipe(
				map(([players, groups]: [Player[], TeamGroup[]]) => {
					this.players = sortBy(players, 'displayName');
					this.groups = sortBy(groups, 'name');
				}),
				tap(() => this.onSelectGroup({ value: this.groups[0] })),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onSelectGroup({ value: group }): void {
		this.selectedGroup = group;
		this.setupPlayers();
		this.isLoading = false;
	}

	private setupPlayers() {
		if (!this.selectedGroup || this.selectedGroup.players === null || this.selectedGroup.players.length === 0) {
			this.selectedPlayers = [];
			this.activePlayers = [...this.players];
		} else {
			this.selectedPlayers = [...this.players.filter(player => this.selectedGroup.players.includes(player.id))];
			this.activePlayers = [...this.players.filter(player => !this.selectedGroup.players.includes(player.id))];
		}
	}

	addGroup(): void {
		this.activePlayers = [...this.players];
		this.selectedGroup = new TeamGroup({
			name: 'New group',
			players: []
		});
		this.onSelectGroup({ value: this.selectedGroup });
		this.edit();
	}

	edit(): void {
		if (!this.selectedGroup) {
			this.addGroup();
		}
		this.groupBackup = cloneDeep(this.selectedGroup);
		this.editMode = true;
	}

	discard(): void {
		this.selectedGroup = !this.selectedGroup.id ? null : cloneDeep(this.groupBackup);
		this.setupPlayers();
		this.editMode = false;
	}

	confirmDelete() {
		this.#confirmationService.confirm({
			message: this.#translate.instant('confirm.delete'),
			header: this.#translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.deleteGroup(),
			reject: () => {}
		});
	}

	confirmEdit() {
		this.#confirmationService.confirm({
			message: this.#translate.instant('confirm.edit'),
			header: this.#translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.save(),
			reject: () => {}
		});
	}

	save(): void {
		this.editMode = false;
		this.selectedGroup.players = this.selectedPlayers.map(({ id }) => id);
		const obs$ = this.selectedGroup.id
			? this.#teamSeasonApi
					.updateByIdGroups(this.#selectedTeamSeason.id, this.selectedGroup.id, this.selectedGroup)
					.pipe(tap(() => this.#alertService.notify('success', 'preferences', 'alert.preferencesUpdated', false)))
			: this.#teamSeasonApi.createGroups(this.#selectedTeamSeason.id, this.selectedGroup).pipe(
					map((group: TeamGroup) => {
						this.groups.push(group);
						this.selectedGroup = group;
					})
				);

		this.#blockUiInterceptorService
			.disableOnce(obs$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => this.setupPlayers(),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	deleteGroup(): void {
		this.editMode = false;
		const index = this.groups.findIndex(({ id }) => id === this.selectedGroup.id);
		this.#blockUiInterceptorService
			.disableOnce(this.#teamSeasonApi.destroyByIdGroups(this.#selectedTeamSeason.id, this.selectedGroup.id))
			.pipe(
				untilDestroyed(this),
				tap(() => {
					if (index !== -1) this.groups.splice(index, 1);
					this.selectedGroup = this.groups[0];
				})
			)
			.subscribe({
				next: () => this.setupPlayers(),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	stop(e) {
		e.stopPropagation();
	}
}
