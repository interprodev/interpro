import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ExtendedPlayerScouting, MedicalPreventionPlayer } from '@iterpro/shared/data-access/sdk';
import {
	PlayerFlagComponent,
	PlayerProviderWidgetComponent,
	PictureComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AvailabiltyService, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { InjuryIconComponent } from '../../injury-icon/injury-icon.component';
import { PlayerCardDetailComponent } from './player-card-detail/player-card-detail.component';
import { DatePipe, NgClass } from '@angular/common';

@Component({
	standalone: true,
	imports: [
		PrimeNgModule,
		TranslateModule,
		PlayerCardDetailComponent,
		PlayerProviderWidgetComponent,
		PictureComponent,
		PlayerFlagComponent,
		InjuryIconComponent,
		FormatDateUserSettingPipe,
		NgClass,
		DatePipe
	],
	selector: 'iterpro-player-card',
	templateUrl: './player-card.component.html'
})
export class PlayerCardComponent {
	@Input() player: MedicalPreventionPlayer & ExtendedPlayerScouting;
	@Input() maintenance = false;
	@Input() scouting = false;
	@Input() maxImportableReached = false;
	@Input() maxArchivableReached = false;
	@Input() isPlayerDescriptionTipss = true;
	@Input() isPlayersLoading: boolean;

	@Output() clickedPlayer: EventEmitter<any> = new EventEmitter<any>();
	@Output() clickedActivation: EventEmitter<any> = new EventEmitter<any>();
	@Output() clickedArchiviation: EventEmitter<any> = new EventEmitter<any>();
	@Output() clickedDelete: EventEmitter<any> = new EventEmitter<any>();

	readonly #availabilityService = inject(AvailabiltyService);

	onClickPlayer(player: any) {
		this.clickedPlayer.emit(player);
	}

	openDeleteDialog(event, player) {
		event.stopPropagation();
		this.clickedDelete.emit(player);
	}

	openArchiveDialog(event, player) {
		event.stopPropagation();
		this.clickedArchiviation.emit(player);
	}

	openActivateDialog(event, player) {
		event.stopPropagation();
		this.clickedActivation.emit(player);
	}

	getPointColor(player: any): string {
		return this.maintenance ? player.readiness : this.#availabilityService.getCurrentHealthStatusColor(player);
	}
}
