import { Injectable } from '@angular/core';
import { concatMap, finalize, first, map, take } from 'rxjs/operators';
import { forkJoin, from, Observable, of } from 'rxjs';
import { SelectItem } from 'primeng/api';
import { BlockUiInterceptorService } from './block-ui-interceptor.service';
import { ProviderIntegrationService } from './providers/provider-integration.service';
import { splitArrayInChunks } from '../utils/functions/utils.functions';
@Injectable({
	providedIn: 'root'
})
export class ClubNameService {
	cachedClubNames: SelectItem[] = [];
	clubNamesLoaded: boolean;
	constructor(
		private blockUiInterceptorService: BlockUiInterceptorService,
		private providerIntegrationService: ProviderIntegrationService
	) {}
	//#region Club Names
	public initClubNames(clubIds: number[]) {
		this.clubNamesLoaded = false;
		if (clubIds.length === 0) return;
		const chunks: number[][] = splitArrayInChunks<number>(clubIds, 5);
		this.blockUiInterceptorService
			.disableOnce(this.manageClubHttpRequests(chunks, this.loadClubName.bind(this)))
			.pipe(
				take(chunks.length),
				finalize(() => {
					this.clubNamesLoaded = true;
				})
			)
			.subscribe({
				error: error => console.error(error)
			});
	}
	private manageClubHttpRequests(chunks: number[][], fn: (...args) => Observable<number>, ...args: any[]) {
		return from(chunks).pipe(
			concatMap((chunk: number[]) =>
				chunk.length > 0 ? forkJoin(chunk.map(teamName => fn(teamName, ...args))) : of([])
			)
		);
	}
	getCachedClub(clubId: number): SelectItem {
		return this.cachedClubNames.find(({ value }) => value === clubId);
	}
	private addClubToCache(club: { name: string; id: number }) {
		if (club.id) {
			this.cachedClubNames.push({ label: club.name, value: club.id });
			return club;
		}
	}
	private loadClubName(clubId: number) {
		const found = this.getCachedClub(clubId);
		return found
			? of([found])
			: this.providerIntegrationService.searchTeam(clubId.toString(), true).pipe(
					first(),
					map(clubs => {
						this.addClubToCache({
							name: clubs[0] ? clubs[0].officialName : undefined,
							id: clubs[0] ? clubs[0].wyId : undefined
						});
					})
			  );
	}
	//#endregion
}
