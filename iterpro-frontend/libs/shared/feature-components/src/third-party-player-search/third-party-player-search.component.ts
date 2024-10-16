import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { AlreadyImportedPlayer, ProviderType } from '@iterpro/shared/data-access/sdk';
import { ProviderTypeService } from '@iterpro/shared/utils/common-utils';
import { InstatPlayerSearchComponent } from './instat-player-search/instat-player-search.component';
import { WyscoutPlayerSearchComponent } from './wyscout-player-search/wyscout-player-search.component';

@Component({
	standalone: true,
	imports: [CommonModule, InstatPlayerSearchComponent, WyscoutPlayerSearchComponent],
	selector: 'iterpro-third-party-player-search',
	templateUrl: './third-party-player-search.component.html',
	styleUrls: ['./third-party-player-search.component.scss']
})
export class ThirdPartyPlayerSearchComponent {
	@Input() alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	@Input() selection!: 'single' | 'multiple';
	@Output() selectPlayersEmitter: EventEmitter<any[]> = new EventEmitter<any[]>();
	@Output() discardEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Input() provider: ProviderType;

	constructor(
		private readonly providerService: ProviderTypeService,
		private readonly currentTeamService: CurrentTeamService
	) {
		this.provider = this.providerService.getProviderType(this.currentTeamService.getCurrentTeam());
	}

	selectPlayers($event: any) {
		this.selectPlayersEmitter.emit($event);
	}

	discard() {
		this.discardEmitter.emit();
	}
}
