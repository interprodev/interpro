import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Customer, Player, PlayerTransfer } from '@iterpro/shared/data-access/sdk';
import { sortBy } from 'lodash';

@Pipe({
	standalone: true,
	name: 'playersToDropdownType'
})
export class PlayersToDropdownTypePipe implements PipeTransform {
	transform(players: Player[] | PlayerTransfer[]): PlayerDropdownType[] {
		return sortBy(
			(players || []).map(({ id, displayName, downloadUrl }) => ({
				id,
				displayName,
				downloadUrl
			})),
			'label'
		);
	}
}
export type PlayerDropdownType = {
	id: string;
	displayName: string;
	downloadUrl: string;
}
