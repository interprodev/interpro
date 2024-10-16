import { Pipe } from '@angular/core';
import { SelectablePlayer } from '../event-viewer.component';

@Pipe({
	name: 'selectablePlayersAreAllChecked'
})
export class SelectablePlayersAreAllCheckedPipe {
	transform(value: SelectablePlayer[]): boolean {
		return value.every(({ allSelected }) => allSelected);
	}
}
