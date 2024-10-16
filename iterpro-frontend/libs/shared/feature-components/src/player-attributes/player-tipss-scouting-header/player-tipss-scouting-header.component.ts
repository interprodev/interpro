import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Customer, ExtendedPlayerScouting, Player, Team } from '@iterpro/shared/data-access/sdk';
import { PlayerAttributesEntriesComponent } from '../player-attributes-entries/player-attributes-entries.component';
import { PlayerScoutingReportSummaryHeaderComponent } from '../player-scouting-report-summary-header/player-scouting-report-summary-header.component';

@Component({
	standalone: true,
	imports: [CommonModule, PlayerScoutingReportSummaryHeaderComponent, PlayerAttributesEntriesComponent],
	selector: 'iterpro-tipss-scouting-header',
	templateUrl: './player-tipss-scouting-header.component.html',
	styleUrls: ['./player-tipss-scouting-header.component.scss']
})
export class PlayerTipssScoutingHeaderComponent {
	@Input({required: true}) player!: Player | ExtendedPlayerScouting;
	@Input({required: true}) team!: Team;
	@Input({required: true}) playerDescriptionSetting!: 'tipss' | 'attributes';
	@Input({required: true}) customers: Customer[] = [];
	@Input({required: true}) type!: 'Player' | 'PlayerScouting';
	@Input({required: true}) scoutingMode: 'redirectToReports' | 'showAttributes' = 'redirectToReports';
	@Input({required: true}) showCalculatedBy = true;
	@Output() scoutingRedirect: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
}
