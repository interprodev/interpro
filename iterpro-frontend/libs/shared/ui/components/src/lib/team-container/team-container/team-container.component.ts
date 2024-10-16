import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
	GenericSportBasicRoles,
	ThirdPartyClubGameTeam,
	ThirdPartyLinkedPlayer
} from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { RoleContainerComponent } from '../role-container/role-container.component';
import {
	SportType,
	getScoreIcon,
	getScoreIconTooltip,
	getSportParameters,
	getPositionCategories
} from '@iterpro/shared/utils/common-utils';
import { PictureComponent } from '../../picture/picture.component';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, RoleContainerComponent, PictureComponent],
	selector: 'iterpro-team-container',
	templateUrl: './team-container.component.html',
	styleUrls: ['./team-container.component.scss']
})
export class TeamContainerComponent implements OnInit {
	@Input({required: true}) team!: ThirdPartyClubGameTeam;
	@Input() showHeader = true;
	@Input({required: true}) editable = false;
	@Input({required: true}) selectable = false;
	@Input({required: true}) sportType: SportType = 'football';
	@Input({required: true}) displayEmptyPlayers = false;
	sets: string[] = [];
	hasMultipleGameSets: boolean = false;
	hasTwoGameSets: boolean = false;
	positions!: string[];

	ngOnInit() {
		this.positions = getPositionCategories(this.sportType);
		this.sets = Array.from(Array(getSportParameters(this.sportType).sets)).map(
			(val, index) => `scoreSet${index + 1}`
		);
		this.hasMultipleGameSets = this.checkHasMultipleGameSets();
		this.hasTwoGameSets = this.checkHasTwoGameSets();
	}


	private checkHasMultipleGameSets(): boolean {
		return (
			this.sportType === 'volleyball' ||
			this.sportType === 'basketball' ||
			this.sportType === 'iceHockey' ||
			this.sportType === 'americanFootball'
		);
	}

	private checkHasTwoGameSets(): boolean {
		return this.sportType === 'football' || this.sportType.includes('rugby');
	}

	getScoreIcon(): string {
		return getScoreIcon(this.sportType);
	}

	getScoreIconTooltip(): string {
		return getScoreIconTooltip(this.sportType);
	}
}
