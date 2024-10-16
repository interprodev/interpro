import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScoutingEventDetailComponent } from '@iterpro/players/scouting/event/feature-detail';
import { ScoutingEventGameReportListComponent } from '@iterpro/players/scouting/event/feature-game-report-list';
import { ScoutingEventLineUpComponent } from '@iterpro/players/scouting/event/feature-line-up';
import { ScoutingEventMatchStatsComponent } from '@iterpro/players/scouting/event/feature-match-stats';
import {
	SandBoxDetailService,
	SandBoxGameReportService,
	SandBoxLineUpService,
	SandBoxMatchStatsService,
	ScoutingEventSandBoxBridgeService,
	ScoutingEventSandBoxModule
} from '@iterpro/players/scouting/event/sand-box';
import { JsonSchema, Schema, ScoutingGameInit } from '@iterpro/shared/data-access/sdk';
import { AlertComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	BlockUiInterceptorService,
	ScoutingGameReportTemplateApiService,
	ProviderIntegrationService,
	SchemaConversionService,
	getOptionsByType,
	standardTemplate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { first } from 'rxjs/operators';
import { MultiSelectChangeEvent } from 'primeng/multiselect';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		ScoutingEventSandBoxModule,
		ScoutingEventDetailComponent,
		AlertComponent,
		ScoutingEventDetailComponent,
		ScoutingEventLineUpComponent,
		ScoutingEventMatchStatsComponent,
		ScoutingEventGameReportListComponent
	],
	selector: 'iterpro-scouting-event-shell',
	templateUrl: './scouting-event-shell.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingEventShellComponent implements OnDestroy {
	clubId!: string;

	@Input() backButtonLabel = 'back.to.calendar';
	@Input()
	set game(scoutingGame: ScoutingGameInit) {
		const { clubId } = scoutingGame.game;
		this.clubId = clubId;
		const templateKey = scoutingGame.settings?.activeGameReportTemplateId;
		const templateVersion = scoutingGame.settings?.activeGameReportTemplateVersion;
		this.loadActiveTemplate(clubId, templateKey, templateVersion);
		this.sandBoxDetail.game$.next({
			...scoutingGame,
			game: {
				...scoutingGame.game,
				thirdPartyProvider: scoutingGame.game?.thirdPartyProvider
					? scoutingGame.game?.thirdPartyProvider
					: this.providerIntegrationService.provider
			}
		});
	}

	@Output()
	get save() {
		return this.sandBoxDetail.saveEmitter$;
	}

	@Output()
	get close() {
		return this.sandBoxDetail.closeEmitter$;
	}

	@Output()
	get delete() {
		return this.sandBoxDetail.deleteEmitter$;
	}

	@Output()
	get playerLensClicked() {
		return this.sandBoxGameReport.playerLensClickedEmitter$;
	}

	@Output()
	get newScoutingPlayers() {
		return this.sandBoxGameReport.newScoutingPlayersEmitter$;
	}
	activeGameReportTemplate!: Schema;

	constructor(
		public sandBoxDetail: SandBoxDetailService,
		public sandBoxLineUp: SandBoxLineUpService,
		public sandBoxMatchStats: SandBoxMatchStatsService,
		public sandBoxGameReport: SandBoxGameReportService,
		private sandBoxBridge: ScoutingEventSandBoxBridgeService,
		private schemaConversionService: SchemaConversionService,
		private gameReportTemplateApiService: ScoutingGameReportTemplateApiService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private providerIntegrationService: ProviderIntegrationService
	) {}

	ngOnDestroy(): void {
		this.sandBoxBridge.destroyAllStores$.next(true);
		/*    this.sandBoxDetail.sb.destroy()
    this.sandBoxBridge.sb.destroy()*/
	}

	onToggleLeftPanelMaximize() {
		this.sandBoxDetail.toggleLeftPanelMaximize$.next(true);
	}

	onClickEditButton() {
		this.sandBoxDetail.editClicked$.next(true);
	}

	onClickCloseButton() {
		this.sandBoxDetail.closeEmitter$.next(true);
	}

	onClickDeleteButton() {
		this.sandBoxDetail.deleteEmitter$.next(true);
	}

	onClickSaveButton() {
		this.sandBoxDetail.saveClicked$.next(true);
	}

	onClickDiscardButton() {
		this.sandBoxDetail.discardClicked$.next(true);
	}

	onChangePlayersToCreate(event: MultiSelectChangeEvent) {
		event.itemValue
			? this.sandBoxGameReport.editPlayersCreationList$.next({
					playerId: event.itemValue.value,
					removed: !event.value.includes(event.itemValue.value)
			  })
			: this.sandBoxGameReport.editAllPlayersCreationList$.next({ playerIds: event.value });
	}

	onConfirmCreatePlayers() {
		this.sandBoxGameReport.saveConfirmationDialog$.next(true);
	}

	onDiscardCreatePlayers() {
		this.sandBoxGameReport.discardConfirmationDialog$.next(true);
	}

	private loadActiveTemplate(clubId: string, templateKey: string, templateVersion: number) {
		if (templateKey === standardTemplate.id && templateVersion === standardTemplate.version) {
			this.activeGameReportTemplate = this.getBasicTemplate();
			return;
		}
		this.blockUiInterceptorService
			.disableOnce(this.gameReportTemplateApiService.getTemplateSpecificVersion(clubId, templateKey, templateVersion))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (templateResult: JsonSchema) => {
					const item = this.schemaConversionService.convertToFormStructure(templateResult);
					item.sections.forEach(
						section =>
							(section.properties = this.schemaConversionService
								.getOrderedProperties(section.properties, section?.metadata?.order)
								.map(prop => ({
									...prop,
									options: getOptionsByType(prop)
								})))
					);
					this.activeGameReportTemplate = item;
				},
				error: (error: Error) => console.error(error)
			});
	}

	private getBasicTemplate(): Schema {
		return this.schemaConversionService.convertToFormStructure(standardTemplate as any);
	}
}
