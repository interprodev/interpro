import { Component, effect, inject } from '@angular/core';
import { AuthActions, AuthState } from '@iterpro/shared/data-access/auth';
import {
	ClubApi,
	ClubSeasonApi,
	DialogOutput,
	DialogOutputAction,
	Player,
	Staff,
	Team,
	TeamApi,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	ConfirmationDialogComponent,
	SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	FormatDateUserSettingPipe,
	getDefaultTeamSeasonDate,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { ConfirmationService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { first, take } from 'rxjs/operators';
import { SettingsStore } from '../../../+state/settings.store';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { SettingsTeamsDropdownComponent } from '../settings-teams-dropdown/settings-teams-dropdown.component';
import { TeamSeasonEditComponent } from './components/team-season-edit/team-season-edit.component';
import { ClubSeasonBasic, TeamSeasonEdit } from './models/seasons.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-teams-seasons',
	imports: [
		ActionButtonsComponent,
		PrimeNgModule,
		BadgeModule,
		TranslateModule,
		FormatDateUserSettingPipe,
		SkeletonTableComponent,
		SettingsHeaderComponent,
		SettingsTeamsDropdownComponent
	],
	templateUrl: './settings-teams-seasons.component.html'
})
export class SettingsTeamsSeasonsComponent implements CanComponentDeactivate {
	// Services
	readonly #authStore = inject(Store<AuthState>);
	readonly #translate = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	readonly #errorService = inject(ErrorService);
	readonly #dialogService: DialogService = inject(DialogService);
	readonly #clubApi = inject(ClubApi);
	readonly #teamApi = inject(TeamApi);
	readonly #clubSeasonApi = inject(ClubSeasonApi);
	readonly settingsStore = inject(SettingsStore);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #translateService = inject(TranslateService);
	readonly #confirmationService = inject(ConfirmationService);
	// Variables
	teamSeasons: TeamSeasonEdit[];
	teamSeasonsBackup: TeamSeasonEdit[];
	selectedRows: TeamSeasonEdit[] = [];
	#selectedTeam: Team;
	#clubPlayers: Player[];
	#clubStaff: Staff[];
	isLoading = false;
	#clubId: string;
	#clubSeasons: ClubSeasonBasic[];
	constructor() {
		effect(() => {
			if (this.settingsStore.clubId() && this.settingsStore.clubId() !== this.#clubId) {
				this.#clubId = this.settingsStore.clubId();
				this.initDatabaseData(this.#clubId);
			}
			if (this.settingsStore.selectedTeam()) {
				this.#selectedTeam = this.settingsStore.selectedTeam();
				this.initTeamSeasons();
			}
		});
	}

	private initTeamSeasons() {
		const teamSeasons: TeamSeason[] = cloneDeep(this.#selectedTeam.teamSeasons);
		this.teamSeasons = sortByDateDesc(teamSeasons, 'offseason');
		this.teamSeasonsBackup = cloneDeep(this.teamSeasons);
	}

	canDeactivate(): boolean {
		return this.selectedRows.length === 0;
	}

	private initDatabaseData(clubId: string): void {
		this.isLoading = true;
		this.#blockUiInterceptorService
			.disableOnce(forkJoin([this.loadClubPlayers(clubId), this.loadClubStaff(clubId), this.loadClubSeasons(clubId)]))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => (this.isLoading = false),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private loadClubPlayers(clubId: string): Observable<Player[]> {
		return this.#clubApi
			.getPlayers(clubId, {
				fields: [
					'id',
					'displayName',
					'firstName',
					'lastName',
					'downloadUrl',
					'nationality',
					'captain',
					'birthDate',
					'position',
					'jersey'
				],
				order: 'displayName DESC'
			})
			.pipe(
				map((players: Player[]) => {
					this.#clubPlayers = players;
					return players;
				})
			);
	}

	private loadClubStaff(clubId: string): Observable<Staff[]> {
		return this.#clubApi
			.getStaff(clubId, {
				fields: ['id', 'firstName', 'lastName', 'nationality', 'birthDate', 'downloadUrl', 'position'],
				order: 'lastName DESC'
			})
			.pipe(
				map((staff: Staff[]) => {
					this.#clubStaff = staff;
					return staff;
				})
			);
	}

	private loadClubSeasons(clubId: string): Observable<ClubSeasonBasic[]> {
		return this.#clubSeasonApi
			.find({
				where: {
					clubId: clubId
				},
				fields: ['id', 'name', 'start', 'end']
			})
			.pipe(
				map((clubSeasons: ClubSeasonBasic[]) => {
					this.#clubSeasons = sortByDateDesc(clubSeasons, 'start');
					return this.#clubSeasons;
				})
			);
	}

	private loadTeamSeasons(teamId: string): Observable<TeamSeason[]> {
		return this.#teamApi.getTeamSeasons(teamId).pipe(
			map((teamSeasons: TeamSeason[]) => {
				return teamSeasons;
			})
		);
	}

	discard() {
		this.teamSeasons = this.teamSeasonsBackup;
		this.selectedRows = [];
	}

	deleteSeasons() {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.deleteAll'),
			header: 'IterPRO',
			accept: () => {
				const removedSeasonsObs$: Observable<TeamSeasonEdit>[] = this.selectedRows.map(season =>
					this.#teamApi.destroyByIdTeamSeasons(this.#selectedTeam.id, season.id)
				);
				this.handleUpdateRecords(removedSeasonsObs$);
			}
		});
	}

	private handleUpdateRecords(obs$: Observable<TeamSeasonEdit>[]) {
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(
				untilDestroyed(this),
				switchMap(() => this.loadTeamSeasons(this.#selectedTeam.id))
			)
			.subscribe({
				next: (teamSeasons: TeamSeason[]) => {
					this.selectedRows = [];
					this.settingsStore.setTeamSeasons(this.#selectedTeam.id, teamSeasons);
					this.#authStore.dispatch(
						AuthActions.performPatchTeam({
							teamId: this.settingsStore.selectedTeamId(),
							team: { ...this.#selectedTeam, teamSeasons }
						})
					);
					this.#alertService.notify('success', 'club.settings', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	//region Team Season Edit Dialog

	addNewSeason() {
		const selectedTeamSeason = this.settingsStore.selectedTeamSeason();
		if (!selectedTeamSeason) {
			this.openTeamSeasonEditDialog();
			return;
		}
		const ref = this.#dialogService.open(ConfirmationDialogComponent, {
			data: {
				description: this.#translate.instant('confirm.createNewSeason', { value: selectedTeamSeason.name }),
				actionTrueLabel: 'buttons.copy',
				actionTrueIcon: 'fa fa-copy',
				actionFalseLabel: 'buttons.dontCopy'
			},
			width: '40%',
			closable: false
		});
		ref.onClose.pipe(take(1)).subscribe({
			next: (result: { choice: boolean }) => {
				if (result.choice) {
					this.openTeamSeasonEditDialog(null, true);
				} else {
					this.openTeamSeasonEditDialog();
				}
			}
		});
	}

	editSeason(season: TeamSeasonEdit) {
		this.openTeamSeasonEditDialog(season);
	}

	private openTeamSeasonEditDialog(season?: TeamSeasonEdit, copyFromCurrentOne?: boolean) {
		this.selectedRows = [];
		const ref = this.createTeamSeasonEditDialog(season, copyFromCurrentOne);
		ref.onClose
			.pipe(take(1))
			.subscribe((result: DialogOutput<Partial<TeamSeason>>) => {
			if (result) {
				let obs$: Observable<any>;
				const editedSeason = result.data;
				switch (result.action) {
					case DialogOutputAction.Edit:
						obs$ = editedSeason?.id
							? this.#teamApi.updateByIdTeamSeasons(this.#selectedTeam.id, editedSeason.id, editedSeason)
							: this.#teamApi.createTeamSeasons(this.#selectedTeam.id, editedSeason);
						break;
					case DialogOutputAction.Delete:
						obs$ = this.#teamApi.destroyByIdTeamSeasons(this.#selectedTeam.id, editedSeason.id);
						break;
				}
				this.handleUpdateRecords([obs$]);
			}
		});
	}

	private createTeamSeasonEditDialog(teamSeason?: TeamSeasonEdit, copyFromCurrentOne?: boolean): DynamicDialogRef {
		const baseLabel = teamSeason?.id ? 'settings.editTeamSeason' : 'settings.newTeamSeason';
		let header = this.#translate.instant(baseLabel);
		if (teamSeason?.id) header += `: ${teamSeason.name}`;
		return this.#dialogService.open(TeamSeasonEditComponent, {
			data: {
				teamSeason: teamSeason ? teamSeason : this.defaultTeamSeason(new Date(), copyFromCurrentOne),
				team: this.#selectedTeam,
				clubPlayers: this.#clubPlayers,
				clubStaff: this.#clubStaff,
				clubSeasons: this.#clubSeasons,
				isNationalClub: this.settingsStore.isNationalClub(),
				header
			},
			width: '80%',
			height: '90%',
			closable: false,
			modal: true,
			showHeader: false,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}
	//endregion

	private defaultTeamSeason(baseDate?: Date, copyFromCurrentOne?: boolean): TeamSeason {
		const currentTeamSeason = this.settingsStore.selectedTeamSeason();
		return new TeamSeason({
			name: null,
			teamId: this.#selectedTeam.id,
			clubSeasonId: null,
			competitionInfo: [],
			staffIds: copyFromCurrentOne ? currentTeamSeason?.staffIds || [] : [],
			playerIds: copyFromCurrentOne ? currentTeamSeason?.playerIds || [] : [],
			wyscoutAreas: [],
			...getDefaultTeamSeasonDate(baseDate)
		});
	}
}
