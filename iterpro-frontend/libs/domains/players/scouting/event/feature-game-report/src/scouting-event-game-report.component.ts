import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SandBoxGameReportService } from '@iterpro/players/scouting/event/sand-box';
import {
	Attachment,
	Customer,
	LoopBackAuth,
	PlayerScouting,
	Schema,
	ScoutingGameReportAttachmentType,
	ScoutingGameReportWithPlayer,
	levels,
	ScoutingGameEssentialCustomer
} from '@iterpro/shared/data-access/sdk';
import { ArrayFromNumberPipe, LastAuthorPipe, SelectItemPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { CustomReportDataChangeOutput, CustomReportTemplateComponent } from '@iterpro/shared/ui/components';
import { PlayerPerformanceReportComponent } from '@iterpro/players/shared';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		SelectItemPipe,
		ArrayFromNumberPipe,
		PlayerPerformanceReportComponent,
		CustomReportTemplateComponent,
		LastAuthorPipe
	],
	selector: 'iterpro-scouting-event-game-report',
	templateUrl: './scouting-event-game-report.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingEventGameReportComponent {
	@Input({ required: true }) index!: number;
	@Input({ required: true }) clubId!: string;
	@Input({ required: true }) isOnEditMode!: boolean;
	@Input({ required: true }) gameDate!: Date;
	@Input({ required: true }) reportPlayer!: ScoutingGameReportWithPlayer;
	@Input({ required: false }) notCategorized!: boolean;
	@Input({ required: true }) currentScout!: ScoutingGameEssentialCustomer;
	@Input({ required: true }) isScoutingAdmin!: boolean;
	@Input({ required: false }) bothTeamsOptions!: SelectItem[];
	@Input({ required: true }) scoutsOptions!: SelectItem[];
	@Input({ required: true }) isReportsLoading!: boolean;
	@Input({ required: true }) schema!: Schema;

	levels: string[] = levels;
	customer: Customer;

	constructor(
		private auth: LoopBackAuth,
		private sandBoxGameReport: SandBoxGameReportService
	) {
		this.customer = this.auth.getCurrentUserData();
	}

	getPlayerName(player: PlayerScouting): string {
		if (player.name && player.lastName) return `${player.name} ${player.lastName}`;
		else return player.displayName;
	}

	deleteReport(reportPlayer: ScoutingGameReportWithPlayer) {
		const base = {
			index: this.index,
			teamId: reportPlayer.thirdPartyProviderTeamId
		};
		if (reportPlayer.id) {
			this.sandBoxGameReport.deleteSavedGameReport$.next({ ...base, reportId: reportPlayer.id });
		} else {
			this.sandBoxGameReport.deleteTempGameReport$.next(base);
		}
	}

	onScoutChange(reportPlayer: ScoutingGameReportWithPlayer, scoutId: string) {
		const scout: any = this.scoutsOptions.find(({ value }) => value === scoutId);
		if (scout?.assignedPlayersIds.includes(reportPlayer?.playerScoutingId)) {
			this.onGameReportChange('scoutId', reportPlayer?.scoutId);
		} else {
			this.onGameReportChange('scoutId', scoutId);
		}
	}
	onGameReportChange(property: string, value: any) {
		const report: Partial<ScoutingGameReportWithPlayer> = { [property]: value };
		this.sandBoxGameReport.updateGameReport.next({
			teamId: this.reportPlayer.thirdPartyProviderTeamId,
			index: this.index,
			payload: report,
			reportId: this.reportPlayer?.id,
			authorId: this.customer.id
		});
	}

	onReportDataChange({ sectionId, propertyName, eventValue }: CustomReportDataChangeOutput) {
		const reportData: Partial<ScoutingGameReportWithPlayer> = { [propertyName]: eventValue };
		this.sandBoxGameReport.updateGameReportData.next({
			teamId: this.reportPlayer.thirdPartyProviderTeamId,
			index: this.index,
			payload: reportData,
			reportId: this.reportPlayer?.id,
			authorId: this.customer.id,
			sectionId
		});
	}

	addAttachment(attachment: Attachment, type: ScoutingGameReportAttachmentType) {
		const attachments: Attachment[] = [...this.reportPlayer[type], attachment];
		this.onGameReportChange(type, attachments);
	}

	deleteAttachment(attachment: Attachment, type: ScoutingGameReportAttachmentType) {
		const attachments: Attachment[] = this.reportPlayer[type].filter(att => att.id !== attachment.id);
		this.onGameReportChange(type, attachments);
	}

	isFutureEvent(): boolean {
		return moment(this.gameDate).isAfter(moment());
	}

	onClickPlayerLens(player: ScoutingGameReportWithPlayer) {
		this.sandBoxGameReport.playerLensClickedEmitter$.next(player.playerScoutingId);
	}

	onTeamSelected(event: any) {
		const selected = this.bothTeamsOptions.find(({ value }) => value === event.value);
		if (!selected) return;
		this.sandBoxGameReport.selectTeamForNonCategorizedPlayer.next({
			thirdPartyProviderPlayerId: this.reportPlayer.thirdPartyProviderId,
			teamId: selected.value
		});
	}
}
