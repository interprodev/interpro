import { Component, HostListener, inject } from '@angular/core';
import { AuthSelectors, AuthState, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Club,
	ClubApi,
	ClubSeason, Customer,
	Player,
	Team,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { AlertService, EditModeService, ErrorService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { combineLatest, Observable, Observer, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, first } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import { Store } from '@ngrx/store';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { TabViewChangeEvent } from 'primeng/tabview';

@UntilDestroy()
@Component({
	selector: 'iterpro-finance-overview',
	templateUrl: './finance-overview.component.html',
	styleUrls: ['./finance-overview.component.css']
})
export class FinanceOverviewComponent {
	selectedSeason: TeamSeason;
	players: Player[] = [];
	clubSeason: ClubSeason;
	teams: Team[];
	teamOptions: SelectItem[];
	selectedTeamId: string;
	selectedTeam: Team;
	@BlockUI('chart') chartBlockUI: NgBlockUI;
	@BlockUI('general') generalBlockUI: NgBlockUI;
	#currentTeamId: string;
	#currentCustomerId: string;
	// Services
	readonly #clubApi = inject(ClubApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #errorService = inject(ErrorService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #translateService = inject(TranslateService);
	readonly #editService = inject(EditModeService);
	readonly #alertService = inject(AlertService);
	readonly currentTeamService = inject(CurrentTeamService);
	readonly #teamSeasonApi = inject(TeamSeasonApi);
	readonly #permissionService = inject(PermissionsService);
	readonly #currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	viewTypes: MenuItem[] = [
		{
			id: 'overviewView',
			label: 'financial.overview',
			icon: 'fas fa-id-card',
			command: () => this.activeViewType = this.viewTypes[0]
		},
		{
			id: 'analysisView',
			label: 'financial.comparison',
			icon: 'fas fa-chart-simple',
			command: () => this.activeViewType = this.viewTypes[1]
		}
	];
	activeViewType: MenuItem = this.viewTypes[0];
	constructor() {
		combineLatest(this.#customer$, this.#currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([customer, currentTeam]: [Customer, Team]) => !!customer && !!currentTeam),
				switchMap(([customer, currentTeam]: [Customer, Team]) => {
					this.#currentCustomerId = customer.id;
					this.#currentTeamId = currentTeam.id;
					const availableTeamIds = this.#permissionService.getUserAvailableTeamIdsByPermissions('finance-overview', customer.admin, customer.teamSettings);
					return this.loadAll(currentTeam.clubId, availableTeamIds);
				})
			)
			.subscribe({
				next: club => this.setInitData(club, this.#currentTeamId),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.#editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.#confirmationService.confirm({
				message: this.#translateService.instant('confirm.editGuard'),
				header: this.#translateService.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.#editService.editMode = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}

	onSelectSeason(event: DropdownChangeEvent) {
		this.selectedSeason = event.value;
		this.getPeople();
	}

	onSelectTeam(event: DropdownChangeEvent) {
		this.selectedTeam = this.teams.find(({ id }) => id === event.value);
		this.getSelectedTeamDetails(this.selectedTeam);
	}

	// get the initial data: club with clubSeasons, agents and teams with related teamSeasons
	private loadAll(clubId: string, availableTeamIds: string[]): Observable<Club> {
		return this.#clubApi
			.findOne({
				where: { _id: clubId },
				include: [
					{
						relation: 'teams',
						scope: {
							where: { _id: { inq: availableTeamIds } },
							include: [
								{
									relation: 'teamSeasons',
									scope: {
										fields: ['offseason', 'inseasonEnd', 'id', 'name', 'playerIds', 'staffIds', 'competitionInfo'],
										order: 'offseason DESC'
									}
								}
							]
						}
					},
					{
						relation: 'customers',
						scope: {
							fields: ['id'],
							include: [
								{
									relation: 'teamSettings'
								}
							]
						}
					},
					{
						relation: 'clubSeasons'
					}
				]
			})
			.pipe(first(), untilDestroyed(this)) as Observable<Club>;
	}

	private setInitData(club: Club, currentTeamId: string) {
		club.teams.forEach((team: Team) => {
			team.club = club;
		});
		this.teams = club.teams;
		this.teamOptions = this.teams.map(({ id, name }) => ({ label: name, value: id }));
		this.selectedTeamId = currentTeamId;
		this.selectedTeam = this.teams.find(({ id }) => id === currentTeamId);
		this.clubSeason = club.clubSeasons.find(({ start, end }) =>
			moment().isBetween(moment(start), moment(end), 'day', '[]')
		);
		this.chartBlockUI.start();
		this.getSelectedTeamDetails(this.selectedTeam);
		this.chartBlockUI.stop();
	}

	// extract teamSeasons from the selected team
	private getSelectedTeamDetails(team: Team) {
		this.selectedTeam = team;
		this.selectedTeam['currentTeamSettings'] = this.selectedTeam.club.customers
			.find(({ id }) => id === this.#currentCustomerId)
			.teamSettings.find(({ teamId }) => teamId === this.#currentTeamId);
		this.extractSeason();
	}

	// called when a team is selected: select the current season or the one closest to today
	// trigger the on changes in the child components, which in turn will download seasonal players and data
	private extractSeason() {
		if (isEmpty(this.selectedTeam.teamSeasons)) {
			return this.#alertService.notify('warn', 'Admin Dashboard', 'alert.noSeasonsFound');
		} else {
			this.selectedSeason = this.currentTeamService.extractSeason(this.selectedTeam.teamSeasons);
			if (this.selectedSeason) {
				this.getPeople();
			} else return this.#alertService.notify('warn', 'Amin Dashboard', 'alert.noSeasonsFound');
		}
	}

	// get players and staff when selected a season, input for the three child component
	private getPeople() {
		this.#teamSeasonApi
			.getPlayers(this.selectedSeason.id, {
				fields: [
					'name',
					'lastName',
					'displayName',
					'id',
					'teamId',
					'currentStatus',
					'archived',
					'downloadUrl',
					'value',
					'valueField',
					'_pastValues',
					'_pastAgentValues',
					'_pastClubValues',
					'_pastTransfermarktValues',
					'clubValue',
					'agentValue',
					'_thresholdsFinancial'
				]
			})
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (players: Player[]) => this.players = players,
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	// Message displayed to user when no team season or club season found.
	getMessageForNoTeamSeasons() {
		if (this.players && this.players.length === 0) {
			return this.#translateService.instant('information.empty.player.list');
		} else if (!this.selectedSeason) {
			return this.#translateService.instant('information.teamSeason.notAvailable');
		} else if (!this.clubSeason) {
			return this.#translateService.instant('information.clubSeason.notAvailable');
		} else {
			return this.#translateService.instant('information.teamSeason.notAvailableToday');
		}
	}

	// Redirecting to club setting if teamseason/player in team/ club season not found.
	getClubSettingsLink() {
		const url = '/settings/club-preferences/general';
		const params = {};
		return [url, params];
	}

	// The text is dispalayed when a) No team season found b) Team season found but no player in it 3) No club season found
	getRedirectText() {
		return this.#translateService.instant('redirect.to.clubsettings.text');
	}

	isEmpty(data: TeamSeason[]) {
		return isEmpty(data);
	}
}
