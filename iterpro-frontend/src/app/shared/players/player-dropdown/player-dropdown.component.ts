import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ExtendedPlayerScouting, Player, PlayerTransfer, ReadinessPlayerData } from '@iterpro/shared/data-access/sdk';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { PictureComponent } from '@iterpro/shared/ui/components';
import { PlayersToDropdownTypePipe } from '@iterpro/shared/ui/pipes';
import { NgStyle, NgTemplateOutlet } from '@angular/common';


@Component({
	standalone: true,
	imports: [PrimeNgModule, TranslateModule, FormsModule, PictureComponent, PlayersToDropdownTypePipe, NgStyle, NgTemplateOutlet],
	selector: 'iterpro-player-dropdown',
	templateUrl: './player-dropdown.component.html'
})
export class PlayerDropdownComponent {
	@Input() playerId: string;
	@Input() disabled: boolean;
	@Input({required: true}) options: Player[] | PlayerTransfer[] | ReadinessPlayerData[] | ExtendedPlayerScouting[];
	@Input() optionLabel = 'displayName';
	@Input() filter = true;
	@Input() group = false;
	@Input() showClear = false;
	@Input() placeholder = 'dropdown.placeholderPlayer';
	@Input() imgHeight = '35px';
	@Output() playerIdChanged: EventEmitter<string> = new EventEmitter();

	onPlayerChange(event: DropdownChangeEvent) {
		this.playerIdChanged.emit(event.value);
	}
}
