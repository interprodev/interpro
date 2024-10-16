import { NgStyle } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	IconButtonComponent,
	PictureComponent,
	PlayerFlagComponent
} from '@iterpro/shared/ui/components';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { PeopleBulkChangeItem } from '../people-bulk-change/model/people-bulk-change.model';
import { PeopleBulkChangeComponent } from '../people-bulk-change/people-bulk-change.component';

@Component({
	selector: 'iterpro-team-season-lineup',
	standalone: true,
	imports: [
		ActionButtonsComponent,
		PrimeNgModule,
		PictureComponent,
		PlayerFlagComponent,
		AgePipe,
		IconButtonComponent,
		TranslateModule,
		NgStyle
	],
	templateUrl: './team-season-lineup.component.html'
})
export class TeamSeasonLineupComponent implements OnInit, OnChanges {
	@Input({ required: true }) clubPlayers: Player[];
	@Input({ required: true }) seasonName: string;
	@Input({ required: true }) seasonPlayerIds: string[];
	@Input({ required: true }) editMode: boolean;
	@Output() lineUpChangeEmitter: EventEmitter<string[]> = new EventEmitter<string[]>();
	players: Player[];
	#dialogService: DialogService = inject(DialogService);
	#translate = inject(TranslateService);

	ngOnInit() {
		this.initPlayers();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['seasonPlayerIds']) {
			this.initPlayers();
		}
	}

	private initPlayers() {
		this.players = this.clubPlayers.filter(({ id }) => (this.seasonPlayerIds || []).includes(id));
	}

	openPeopleBulkChangeDialog() {
		const ref = this.createPeopleBulkChangeDialog();
		ref.onClose.subscribe((targetPlayerIds: string[]) => {
			if (targetPlayerIds) {
				this.lineUpChangeEmitter.emit(targetPlayerIds);
			}
		});
	}

	private createPeopleBulkChangeDialog(): DynamicDialogRef {
		const baseLabel = `${this.#translate.instant('admin.lineup')} - ${this.#translate.instant('profile.season')}: ${this.seasonName}`;
		const header = this.#translate.instant(baseLabel);
		return this.#dialogService.open(PeopleBulkChangeComponent, {
			data: {
				sourceItems: (this.clubPlayers || [])
					.filter(({ id }) => !this.players.map(({ id }) => id).includes(id))
					.map(this.playerToPeopleBulkChangeItem.bind(this)),
				targetItems: (this.players || []).map(this.playerToPeopleBulkChangeItem.bind(this)),
				sourceHeader: this.#translate.instant('settings.clubPlayers'),
				targetHeader: this.#translate.instant('settings.teamPlayers'),
				editMode: true
			},
			width: '70%',
			height: '70%',
			header,
			closable: true,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}

	private playerToPeopleBulkChangeItem(player: Player): PeopleBulkChangeItem {
		return {
			id: player.id,
			label: player.displayName,
			imageUrl: player.downloadUrl
		};
	}
}
