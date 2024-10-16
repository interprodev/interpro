import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthSelectors, SelectableTeam } from '@iterpro/shared/data-access/auth';
import {
	AttachmentFileRepository,
	AttachmentFileRepositoryResult,
	CollectionToSection,
	TeamApi,
	attachmentCollectionToSection
} from '@iterpro/shared/data-access/sdk';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Observable, first, of, map, switchMap } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@UntilDestroy()
@Component({
	selector: 'iterpro-repository',
	templateUrl: './repository.component.html',
	styleUrls: ['./repository.component.css']
})
export class RepositoryComponent implements OnInit, OnDestroy {
	selectedTeam$: Observable<SelectableTeam>;
	selectedTeam: SelectableTeam;
	teamFiles: AttachmentFileRepository[] = [];

	constructor(
		private readonly store$: Store<RootStoreState>,
		private readonly teamApi: TeamApi,
		private readonly error: ErrorService
	) {}

	ngOnDestroy() {}

	ngOnInit() {
		this.selectedTeam$ = this.store$.select(AuthSelectors.selectCurrentSelectableTeam);
		this.selectedTeam$
			.pipe(
				untilDestroyed(this),
				map(selectedTeam => (this.selectedTeam = selectedTeam)),
				switchMap(() => this.getAttachments())
			)
			.subscribe({
				error: error => this.error.handleError(error)
			});
	}

	private getAttachments(): Observable<void> {
		if (!this.selectedTeam) return of();
		return this.teamApi.getTeamAttachments(this.selectedTeam.id).pipe(
			first(),
			map((attachments: AttachmentFileRepositoryResult[]) => {
				this.teamFiles = attachments.map(attachment => {
					const sections: CollectionToSection[] = attachmentCollectionToSection(attachment);
					return {
						...attachment,
						redirects: sections
					};
				});
			})
		);
	}
}
