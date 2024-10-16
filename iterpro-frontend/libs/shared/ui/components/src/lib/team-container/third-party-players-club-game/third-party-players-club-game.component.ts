import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
	ThirdPartyClubGameInterface,
} from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { SportType } from '@iterpro/shared/utils/common-utils';
import { TeamContainerComponent } from '../team-container/team-container.component';
import { PictureComponent } from '../../picture/picture.component';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TeamContainerComponent, PictureComponent],
	selector: 'iterpro-third-party-players-club-game',
	templateUrl: './third-party-players-club-game.component.html',
	styleUrls: ['./third-party-players-club-game.component.scss']
})
export class ThirdPartyPlayersClubGameComponent {
	@Input({required: true}) gameDetails!: ThirdPartyClubGameInterface;
	@Input() horizontalAlign!: boolean;
	@Input() tabView!: boolean;
	@Input({required: true}) sportType: SportType = 'football';
	@Input() editable = false;
	@Input() displayEmptyPlayers = false;
	@Input() homeSelectable = false;
	@Input() awaySelectable = false;
}
