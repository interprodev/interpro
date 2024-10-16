import { Component, Input, inject } from '@angular/core';
import { PlayerTransfer, PlayerTransferApi } from '@iterpro/shared/data-access/sdk';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person-notes',
	template: `
		<iterpro-comment-threaded [comments]="player.notesThreads" [editMode]="true" (onUpdate)="update($event)" />
	`
})
export class SquadsPersonNotesComponent {
	@Input() isTransfer = true;
	@Input() player: PlayerTransfer;

	readonly #playerTransferApi = inject(PlayerTransferApi);
	readonly #errorService = inject(ErrorService);

	update(comments: Comment[]) {
		this.#playerTransferApi
			.patchAttributes(this.player.id, { notesThreads: comments })
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (response: any) => {
					this.player.notesThreads = comments;
				},
				error: (error: Error) => {
					this.#errorService.handleError(error);
				}
			});
	}
}
