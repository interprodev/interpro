import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
	ClubSeason,
	ClubTransfer,
	ClubTransferApi,
	PlayerScouting,
	TransferWindow
} from '@iterpro/shared/data-access/sdk';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { flatten } from 'lodash';
import { SelectItem } from 'primeng/api';
import { first } from 'rxjs/operators';
import { ToTransferResult } from './to-transfer-dialog.type';


@UntilDestroy()
@Component({
	selector: 'iterpro-to-transfer-dialog',
	templateUrl: './to-transfer-dialog.component.html',
	styleUrls: ['./to-transfer-dialog.component.css']
})
export class ToTransferDialogComponent implements OnInit, OnDestroy {
	@Input() visible = false;
	@Input() player: PlayerScouting;
	@Input() seasons: ClubSeason[] = [];
	@Output() closeEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() confirmEmitter: EventEmitter<{
		player: PlayerScouting;
		transferWindows: ToTransferResult[];
	}> = new EventEmitter<{ player: PlayerScouting; transferWindows: ToTransferResult[] }>();

	seasonsItem: SelectItem[] = [];
	selectedTransferWindows: ToTransferResult[] = [];

	constructor(private clubTransferApi: ClubTransferApi, private error: ErrorService) {}

	ngOnDestroy() {}

	ngOnInit() {
		this.getClubTransferForPlayer(this.player);
	}

	confirm() {
		this.confirmEmitter.emit({ player: this.player, transferWindows: this.selectedTransferWindows });
	}

	discard() {
		this.closeEmitter.emit();
	}

	getClubTransferForPlayer(player: PlayerScouting) {
		this.clubTransferApi
			.find({
				where: { clubId: player.clubId, playerScoutingId: player.id },
				fields: ['id', 'transferWindowId', 'clubSeasonId']
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (clubTransfers: ClubTransfer[]) => this.mapItems(clubTransfers),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	mapItems(clubTransfers: ClubTransfer[]) {
		this.seasonsItem = flatten(
			this.seasons.map(({ id, name, _transferWindows }) =>
				_transferWindows.reverse().map((window: TransferWindow) => ({
					label: `${name} - ${window.name}`,
					value: {
						...window,
						clubSeasonId: id
					},
					disabled: clubTransfers.some(
						transfer => transfer.clubSeasonId === id && transfer.transferWindowId === window.id
					)
				}))
			)
		).reverse();
	}
}
