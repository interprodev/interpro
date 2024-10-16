import { Injectable, inject } from '@angular/core';
import { LoopBackAuth, TeamApi } from '@iterpro/shared/data-access/sdk';

const defaultCategories = ['SHAREDWITHME', 'TRAINING', 'OTHERS', 'GAMES'];
@Injectable({
	providedIn: 'root'
})
export class VideoMatchesService {
	readonly #teamApi = inject(TeamApi);
	readonly #authService = inject(LoopBackAuth);

	load(categories: string[] = []) {
		const { currentTeamId } = this.#authService.getCurrentUserData();
		return this.#teamApi.getEventVideos(currentTeamId, categories.length ? categories : defaultCategories);
	}
}
