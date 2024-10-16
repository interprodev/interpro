import { Component, HostListener, inject, OnInit } from '@angular/core';
import { BasicWageApi, BonusApi, Club, ClubApi, Customer, Team } from '@iterpro/shared/data-access/sdk';
import { AlertService, EditModeService, ErrorService, getActiveTeams } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ConfirmationService } from 'primeng/api';
import { Observable, Observer, Subject, forkJoin, combineLatest, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, first } from 'rxjs/operators';
import { BonusItem } from './table-bonus/table-bonus.component';
import { IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

export type PersonBonusState = 'discarded';

@UntilDestroy()
@Component({
	selector: 'iterpro-finance-bonus',
	templateUrl: './finance-bonus.component.html',
	styleUrls: ['./finance-bonus.component.css']
})
export class FinanceBonusComponent implements OnInit {
	teams: Team[];
	club: Club;
	playerBonusFlag: 'player' | 'team' = 'player';
	bonusToSave: BonusItem[] = [];
	taxesItem: { taxes: number; vat: number };
	@BlockUI('chart') chartBlockUI: NgBlockUI;

	playerBonusState: Subject<PersonBonusState> = new Subject<PersonBonusState>();
	archived = false;
	// Services
	readonly #clubApi = inject(ClubApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #bonusApi = inject(BonusApi);
	readonly #errorService = inject(ErrorService);
	readonly #alertService = inject(AlertService);
	readonly editService = inject(EditModeService);
	readonly #basicWageApi = inject(BasicWageApi);
	readonly #translateService = inject(TranslateService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #permissionService = inject(PermissionsService);
	readonly #currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	constructor() {
		combineLatest(this.#customer$, this.#currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([customer, currentTeam]: [Customer, Team]) => !!customer && !!currentTeam),
				switchMap(([customer, currentTeam]: [Customer, Team]) => {
					const availableTeamIds = this.#permissionService.getUserAvailableTeamIdsByPermissions('bonus', customer.admin, customer.teamSettings);
					return this.loadClub(currentTeam.clubId, availableTeamIds);
				})
			)
			.subscribe({
				next: result => this.initData(result),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.#confirmationService.confirm({
				message: this.#translateService.instant('confirm.editGuard'),
				header: this.#translateService.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
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

	// get the initial data: club with clubSeasons, agents and teams with related teamSeasons
	private loadClub(clubId: string, availableTeamIds: string[]): Observable<Club> {
		return this.#clubApi
			.findOne({
				where: { _id: clubId },
				include: [
					{
						relation: 'teams',
						scope: {
							where: {
								_id: { inq: availableTeamIds }
							},
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
							fields: ['id', 'teamSettings']
						}
					},
					{
						relation: 'clubSeasons'
					},
					{
						relation: 'agents',
						scope: { fields: ['firstName', 'lastName', 'id', 'teamId', 'assistedIds'] }
					}
				]
			})
			.pipe(first(), untilDestroyed(this)) as Observable<Club>;
	}

	private initData(club: Club) {
		this.chartBlockUI.start();
		club.teams.forEach((team: Team) => {
			team.club = club;
		});
		this.club = club;
		this.teams = club.teams;
		this.taxesItem = { taxes: club.taxes, vat: club.vat };
		this.chartBlockUI.stop();
	}

	ngOnInit() {

	}

	applySave(event: BonusItem[]) {
		this.bonusToSave = event;
	}

	onEdit() {
		this.editService.editMode = true;
	}

	onDiscard() {
		this.editService.editMode = false;
		this.playerBonusState.next('discarded');
	}

	private getApiFromInstance(instance: BonusItem) {
		if (instance.type === 'valorization') return this.#basicWageApi;
		return this.#bonusApi;
	}

	onSave() {
		const obs$ = this.bonusToSave.map(bonus => {
			const api = this.getApiFromInstance(bonus);
			if (!api) return;
			return api.updateAttributes(bonus.id, bonus);
		});
		forkJoin(obs$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.editService.editMode = false;
					this.#alertService.notify('success', 'Financial Dashboard', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}
}
