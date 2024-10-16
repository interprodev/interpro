import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ProviderType, ThirdPartyClubGameInterface } from '@iterpro/shared/data-access/sdk';
import { ThirdPartyPlayersClubGameComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { SportType } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, PrimeNgModule, ThirdPartyPlayersClubGameComponent],
	selector: 'iterpro-scouting-event-line-up',
	templateUrl: './scouting-event-line-up.component.html',
	styleUrls: ['./scouting-event-line-up.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingEventLineUpComponent {
	@Input({required: true}) formation!: ThirdPartyClubGameInterface;
	@Input({required: true}) isLeftPanelMaximized!: boolean;
	@Input({required: true}) sportType!: SportType;
	@Input({required: true}) hasProviderStatsAvailable!: boolean;
	@Input({required: true}) matchProvider!: ProviderType;
	@Output() toggleLeftPanelMaximize: EventEmitter<void> = new EventEmitter<void>();
}
