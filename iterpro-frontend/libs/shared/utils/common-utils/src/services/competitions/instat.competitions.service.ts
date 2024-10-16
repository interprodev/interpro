import { Injectable, inject } from '@angular/core';
import { CompetitionConstantsInterface, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { ErrorService } from '../error.service';
import { JsonLoaderService } from '../json-loader.service';

@Injectable({
	providedIn: 'root'
})
export class InstatCompetitionsConstantsService implements CompetitionConstantsInterface {
	readonly #translateService = inject(TranslateService);
	readonly #jsonLoaderService = inject(JsonLoaderService);
	readonly #errorService = inject(ErrorService);

	private competitionsJson: any;

	initAreasList(): void {}

	getAllAreaIds(): SelectItem[] {
		return [];
	}

	public initCompetitionList(): Observable<object> {
		const competitions$ = this.#jsonLoaderService.loadJson('instatCompetitions', 'json');
		competitions$.subscribe({
			next: res => (this.competitionsJson = res),
			error: (error: Error) => this.#errorService.handleError(error)
		});
		return competitions$;
	}

	public getCompetitions(): SelectItem<string>[] {
		const mappedCompetitions: SelectItem<string>[] = (this.competitionsJson || []).map((competition: any) => ({
			label: competition.name,
			value: competition.teams || competition.instatId
		}));

		return sortBy(mappedCompetitions, 'label');
	}

	public getCompetitionFromJson(id: number | string) {
		return this.competitionsJson.find((competition: any) => String(competition.instatId) === String(id));
	}

	public getCompetitionName(value: string, season: TeamSeason) {
		const { instatNationalLeague, instatNationalCup, instatTournamentQualifiers, instatTournamentFinalStages } = season;
		if (value === 'nationalLeague') {
			return instatNationalLeague
				? this.getCompetitionFromJson(instatNationalLeague).name
				: this.#translateService.instant(value);
		}
		if (value === 'nationalCup') {
			return instatNationalCup
				? this.getCompetitionFromJson(instatNationalCup).name
				: this.#translateService.instant(value);
		}
		if (value === 'tournamentQualifiers') {
			return instatTournamentQualifiers
				? this.getCompetitionFromJson(instatTournamentQualifiers).name
				: this.#translateService.instant(value);
		}
		if (value === 'tournamentFinalStages') {
			return instatTournamentFinalStages
				? this.getCompetitionFromJson(instatTournamentFinalStages).name
				: this.#translateService.instant(value);
		}
		return '';
	}

	getCompetitionsByAreas(): SelectItem<string>[] {
		return this.getCompetitions();
	}
}
