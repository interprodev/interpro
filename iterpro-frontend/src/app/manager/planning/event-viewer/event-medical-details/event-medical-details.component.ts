import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Injury, MedicalEvent, Player } from '@iterpro/shared/data-access/sdk';
import { OSICS, OsicsService, sortByDate } from '@iterpro/shared/utils/common-utils';
import { last } from 'lodash';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-event-medical-details',
	templateUrl: './event-medical-details.component.html',
	styleUrls: ['./event-medical-details.component.css']
})
export class EventMedicalDetailsComponent {
	@Input({required: true}) event: MedicalEvent;
	@Input() selectedInjury: Injury;
	@Input({required: true}) players: Player[];
	@Input({required: true}) player: Player;
	@Input({required: true}) editMode: boolean;
	@Output() selectedPlayerId: EventEmitter<string> = new EventEmitter<string>();
	osicsList: OSICS[] = [];

	constructor(
		private router: Router,
		private osicsService: OsicsService
	) {
		this.osicsList = this.osicsService.getOSICSList();
	}

	getInjuryStatusAtDay(injury: Injury): string {
		if (injury.currentStatus !== 'medical.infirmary.details.statusList.healed') return injury.currentStatus;
		else {
			return last(sortByDate(injury.statusHistory, 'date').filter(x => moment(this.event.start).isAfter(x.date))).phase;
		}
	}

	async showDetails(injury: Injury) {
		if (this.selectedInjury?.id === injury.id) {
			this.selectedInjury = null;
		} else {
			this.selectedInjury = injury;
		}
	}
	async redirectToInjury(injury: Injury) {
		await this.router.navigate(['/medical/infirmary', { id: injury.id }]);
	}

	onSelectPlayer(playerId: string) {
		this.selectedPlayerId.emit(playerId);
	}
}
