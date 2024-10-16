import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Club,
	ClubApi,
	ClubSeason,
	ClubSeasonApi,
	DialogOutput,
	DialogOutputAction
} from '@iterpro/shared/data-access/sdk';
import { ActionButtonsComponent, SkeletonTableComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ConstantService,
	CurrencyType,
	ErrorService,
	FormatDateUserSettingPipe,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { ClubSeasonEditComponent } from './components/club-season-edit.component';
import { ClubSeasonEdit } from './models/seasons.type';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-club-preferences-seasons',
	templateUrl: './club-preferences-seasons.component.html',
	imports: [
		ActionButtonsComponent,
		AsyncPipe,
		SharedModule,
		TranslateModule,
		FormatDateUserSettingPipe,
		BadgeModule,
		SkeletonTableComponent,
		PrimeNgModule,
		SettingsHeaderComponent
	]
})
export class SettingsClubPreferencesSeasonsComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #translate = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	readonly #errorService = inject(ErrorService);
	readonly #dialogService: DialogService = inject(DialogService);
	readonly #clubApi = inject(ClubApi);
	readonly #clubSeasonApi = inject(ClubSeasonApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #constantService = inject(ConstantService);
	readonly #translateService = inject(TranslateService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	// Variables
	#blockUiInterceptorService = inject(BlockUiInterceptorService);
	#club: Club;
	clubSeasons: ClubSeasonEdit[];
	clubSeasonsBackup: ClubSeasonEdit[];
	selectedRows: ClubSeasonEdit[] = [];
	ngOnInit() {
		this.club$
			.pipe(
				distinctUntilChanged(),
				switchMap((club: Club) => {
					this.#club = club;
					return this.loadClubSeasons(club.id);
				})
			)
			.subscribe({
				next: (clubSeasons: ClubSeasonEdit[]) => {},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	canDeactivate(): boolean {
		return this.selectedRows.length === 0;
	}

	private loadClubSeasons(clubId: string): Observable<ClubSeasonEdit[]> {
		return this.#blockUiInterceptorService
			.disableOnce(
				this.#clubSeasonApi.find({
					where: {
						clubId: clubId
					},
					include: ['transferWindows']
				})
			)
			.pipe(
				map((clubSeasons: ClubSeason[]) => {
					this.clubSeasons = sortByDateDesc(clubSeasons, 'start') as ClubSeasonEdit[];
					this.clubSeasonsBackup = cloneDeep(this.clubSeasons);
					return this.clubSeasons;
				})
			);
	}

	discard() {
		this.clubSeasons = this.clubSeasonsBackup;
		this.selectedRows = [];
	}

	deleteSeasons() {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.deleteAll'),
			header: 'IterPRO',
			accept: () => {
				const removedSeasonsObs$: Observable<ClubSeasonEdit>[] = this.selectedRows.map(season =>
					this.#clubApi.destroyByIdClubSeasons(this.#club.id, season.id)
				);
				this.handleUpdateRecords(removedSeasonsObs$);
			}
		});
	}

	private handleUpdateRecords(obs$: Observable<ClubSeasonEdit>[]) {
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(
				untilDestroyed(this),
				switchMap(() => this.loadClubSeasons(this.#club.id))
			)
			.subscribe({
				next: (clubSeasons: ClubSeasonEdit[]) => {
					this.selectedRows = [];
					this.clubSeasons = clubSeasons;
					this.#alertService.notify('success', 'home.clubSettings', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	//region Club Season Edit Dialog

	addNewSeason() {
		this.openClubSeasonEditDialog();
	}

	editSeason(season: ClubSeasonEdit) {
		this.openClubSeasonEditDialog(season);
	}

	private openClubSeasonEditDialog(season?: ClubSeasonEdit) {
		this.selectedRows = [];
		const ref = this.createClubSeasonEditDialog(season);
		ref.onClose.subscribe((result: DialogOutput<ClubSeasonEdit>) => {
			if (result) {
				let obs$: Observable<any>;
				const editedSeason = result.data;
				switch (result.action) {
					case DialogOutputAction.Edit:
						obs$ = editedSeason?.id
							? this.#clubApi.updateByIdClubSeasons(this.#club.id, editedSeason.id, editedSeason)
							: this.#clubApi.createClubSeasons(this.#club.id, editedSeason);
						break;
					case DialogOutputAction.Delete:
						obs$ = this.#clubApi.destroyByIdClubSeasons(this.#club.id, editedSeason.id);
						break;
				}
				this.handleUpdateRecords([obs$]);
			}
		});
	}

	private createClubSeasonEditDialog(clubSeason?: ClubSeasonEdit): DynamicDialogRef {
		const currencyCode = this.#constantService.getCurrencySymbol(this.#club.currency as CurrencyType);
		const baseLabel = clubSeason?.id ? 'settings.editClubSeason' : 'settings.newClubSeason';
		const header = this.#translate.instant(baseLabel);
		return this.#dialogService.open(ClubSeasonEditComponent, {
			data: {
				clubSeason,
				currencyCode: currencyCode,
				orgType: this.#club.type,
				header
			},
			width: '60%',
			height: '50%',
			closable: false,
			modal: true,
			showHeader: false,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}
	//endregion
}
