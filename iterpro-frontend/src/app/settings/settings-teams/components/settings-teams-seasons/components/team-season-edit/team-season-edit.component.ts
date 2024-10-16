import { NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DialogOutput, DialogOutputAction, Player, Staff, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	DialogFooterButtonsComponent,
	DialogHeaderComponent,
	FormFeedbackComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { toTeamPreferenceSeasonForm } from '../../models/seasons.form';
import { ClubSeasonBasic, TeamPreferenceSeasonForm } from '../../models/seasons.type';
import { TeamSeasonCompetitionsComponent } from '../team-season-competitions/team-season-competitions.component';
import { TeamSeasonsDetailsComponent } from '../team-season-details/team-seasons-details.component';
import { TeamSeasonLineupComponent } from '../team-season-lineup/team-season-lineup.component';
import { TeamSeasonStaffComponent } from '../team-season-staff/team-season-staff.component';

@Component({
	selector: 'iterpro-team-season-edit',
	standalone: true,
	imports: [
		TranslateModule,
		TeamSeasonLineupComponent,
		NgStyle,
		TeamSeasonStaffComponent,
		FormFeedbackComponent,
		ReactiveFormsModule,
		TeamSeasonCompetitionsComponent,
		TeamSeasonsDetailsComponent,
		PrimeNgModule,
		DialogFooterButtonsComponent,
		ActionButtonsComponent,
		DialogHeaderComponent
	],
	templateUrl: './team-season-edit.component.html'
})
export class TeamSeasonEditComponent {
	// Input Properties
	teamSeason: TeamSeason;
	team: Team;
	clubPlayers: Player[];
	clubStaff: Staff[];
	clubSeasons: ClubSeasonBasic[];
	isNationalClub: boolean;
	header: string;
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #fb = inject(FormBuilder);
	readonly #translateService = inject(TranslateService);
	// Variables
	seasonForm: FormGroup<TeamPreferenceSeasonForm>;
	saveClicked = false;
	activeMenu: MenuItem;
	menuItems: MenuItem[];
	constructor() {
		this.loadMenuItems();
		this.seasonForm?.reset();
		if (this.#config.data) {
			this.teamSeason = this.#config.data.teamSeason;
			this.team = this.#config.data.team;
			this.clubPlayers = this.#config.data.clubPlayers;
			this.clubStaff = this.#config.data.clubStaff;
			this.clubSeasons = this.#config.data.clubSeasons;
			this.isNationalClub = this.#config.data.isNationalClub;
			this.header = this.#config.data.header;
			this.seasonForm = this.#fb.nonNullable.group(toTeamPreferenceSeasonForm(this.teamSeason?.competitionInfo));
			this.loadForm();
			this.seasonForm.enable();
		}
	}

	private loadMenuItems(): void {
		this.menuItems = [
			{
				label: this.#translateService.instant('preferences.wyscout.competitions'),
				command: () => (this.activeMenu = this.menuItems[0])
			},
			{ label: this.#translateService.instant('admin.lineup'), command: () => (this.activeMenu = this.menuItems[1]) },
			{ label: this.#translateService.instant('admin.staff'), command: () => (this.activeMenu = this.menuItems[2]) }
		];
		this.activeMenu = this.menuItems[0];
	}

	private loadForm(): void {
		this.seasonForm.patchValue({ details: this.teamSeason, competitions: this.teamSeason });
	}

	onDiscard() {
		this.closeDialog();
	}

	onDelete() {
		this.closeDialog({ data: this.teamSeason, action: DialogOutputAction.Delete });
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.seasonForm.valid) return this.#alertService.notify('warn', 'club.settings', 'alert.formNotValid', false);
		this.closeDialog({ data: this.fromFormGroup(), action: DialogOutputAction.Edit });
	}

	private fromFormGroup(): Partial<TeamSeason> {
		const formValue = this.seasonForm.getRawValue();
		const {
			wyscoutAreas,
			wyscoutNationalLeague,
			wyscoutNationalCup,
			wyscoutTournamentQualifiers,
			wyscoutTournamentFinalStages,
			competitionInfo
		} = formValue.competitions;
		const details: Partial<TeamSeason> = {
			...formValue.details,
			thirdPartyCredentials: { ...this.teamSeason.thirdPartyCredentials, ...formValue.details?.thirdPartyCredentials }
		};
		return {
			...(this.teamSeason || {}),
			...details,
			wyscoutAreas,
			wyscoutNationalLeague,
			wyscoutNationalCup,
			wyscoutTournamentQualifiers,
			wyscoutTournamentFinalStages,
			competitionInfo,
			resync: true
		};
	}

	linedUpChanged(ids: string[]) {
		this.teamSeason.playerIds = ids;
		this.seasonForm.markAsDirty();
	}

	staffChanged(ids: string[]) {
		this.teamSeason.staffIds = ids;
		this.seasonForm.markAsDirty();
	}

	private closeDialog(payload?: DialogOutput<Partial<TeamSeason>>) {
		this.#ref.close(payload);
	}
}
