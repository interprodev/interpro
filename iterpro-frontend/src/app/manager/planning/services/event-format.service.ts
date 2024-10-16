import { Injectable, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import { SelectItem } from 'primeng/api';

@Injectable({
	providedIn: 'root'
})
export class EventFormatService {
	readonly #permissionsService = inject(PermissionsService);
	readonly #currentTeamService = inject(CurrentTeamService);

	private formats = [
		{ label: 'event.format.general', value: 'general' },
		{ label: 'event.format.travel', value: 'travel' },
		{ label: 'event.format.training', value: 'training' },
		{ label: 'event.format.game', value: 'game' },
		{ label: 'event.format.medical', value: 'medical' },
		{ label: 'event.format.assessment', value: 'assessment' },
		{ label: 'event.format.administration', value: 'administration' },
		{ label: 'event.format.off', value: 'off' }
	];

	getNationalClubSelectableFormats(filter?: boolean): SelectItem[] {
		return [...this.getCommonFormats(filter), { label: 'event.format.clubGame', value: 'clubGame' }];
	}

	getClubSelectableFormats(filter?: boolean): SelectItem[] {
		return [...this.getCommonFormats(filter), { label: 'event.format.internationalDuty', value: 'international' }];
	}

	private getCommonFormats(filter?: boolean): SelectItem[] {
		return this.formats.filter(({ value }) => value !== 'medical' || this.canAccessMedical());
	}

	private canAccessMedical(): boolean {
		const currentTeam = this.#currentTeamService.getCurrentTeam();
		return (
			this.#permissionsService.canUserAccessToModule('infirmary', currentTeam).response ||
			this.#permissionsService.canUserAccessToModule('maintenance', currentTeam).response
		);
	}
}
