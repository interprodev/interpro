import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthSelectors, AuthState} from '@iterpro/shared/data-access/auth';
import {
	ClubApi,
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	Player,
	PlayerReportEntriesEmitter,
	PlayerScouting,
	ScoutingGameWithReport,
	Team,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import {
	PlayerProviderWidgetComponent,
	PriceRangeComponent,
	ReportDownloadComponent,
	TacticBoardComponent,
	PictureComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { ErrorService, FormatDateUserSettingPipe, SportType } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { distinctUntilChanged, filter, first } from 'rxjs/operators';
import { PlayerAttributesCompareComponent } from '../player-attributes-compare/player-attributes-compare.component';
import { PlayerAttributesEntriesComponent } from '../player-attributes-entries/player-attributes-entries.component';
import { PlayerChartScoutingSwissComponent } from '../player-chart-scouting-swiss/player-chart-scouting-swiss.component';
import { PlayerDescriptionsEntriesComponent } from '../player-descriptions-entries/player-descriptions-entries.component';
import { PlayerDevelopmentScoutingSwissComponent } from '../player-development-scouting-swiss/player-development-scouting-swiss.component';
import { PlayerDevelopmentComponent } from '../player-development/player-development.component';
import { PlayerTipssScoutingHeaderComponent } from '../player-tipss-scouting-header/player-tipss-scouting-header.component';
import { PlayerVideoGalleryComponent } from '../player-video-gallery/player-video-gallery.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		PrimeNgModule,
		PlayerTipssScoutingHeaderComponent,
		PlayerAttributesEntriesComponent,
		PlayerDescriptionsEntriesComponent,
		PlayerProviderWidgetComponent,
		PlayerDevelopmentComponent,
		PlayerDevelopmentScoutingSwissComponent,
		PlayerChartScoutingSwissComponent,
		PlayerVideoGalleryComponent,
		PlayerAttributesCompareComponent,
		TacticBoardComponent,
		ReportDownloadComponent,
		PictureComponent,
		PriceRangeComponent,
		FormatDateUserSettingPipe
	],
	selector: 'iterpro-player-report',
	templateUrl: './player-report.component.html',
	styleUrls: ['./player-report.component.scss']
})
export class PlayerReportComponent {
	@Input({required: true}) player!: Player | ExtendedPlayerScouting;
	@Input({required: true}) type!: 'Player' | 'PlayerScouting';
	@Input() scoutingMode: 'redirectToReports' | 'showAttributes' = 'redirectToReports';
	@Input() showCalculatedBy = true;
	@Input() scoutingGames: ScoutingGameWithReport[] = [];
	@Input() sportType!: SportType;
	@Input() seasons!: TeamSeason[];
	@Input() scoutingPlayers: PlayerScouting[] = [];
	@Output() scoutingRedirect: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
	@Output() downloadEntirePdf: EventEmitter<void> = new EventEmitter<void>();
	@Output() playerReportEmitter: EventEmitter<PlayerReportEntriesEmitter> =
		new EventEmitter<PlayerReportEntriesEmitter>();
	customers!: Customer[];
	team!: Team;
	playerDescriptionSetting!: 'tipss' | 'attributes';
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());

	constructor(
		private clubApi: ClubApi,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private authStore: Store<AuthState>
	) {
		this.#currentTeam$.pipe(
			distinctUntilChanged(),
			filter(team => !!team)
		).subscribe({
			next: (team: Team | undefined) => {
				if (team) {
					this.team = team;
					this.playerDescriptionSetting = this.team?.club.scoutingSettings.playerDescription;
					this.loadCustomers();
				}
			}
		})
	}

	private loadCustomers() {
		this.clubApi
			.getCustomers(this.auth.getCurrentUserData().clubId, {
				fields: ['firstName', 'lastName', 'id']
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (customers: Customer[]) => {
					this.customers = customers;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}
}
