import { Injectable, inject } from '@angular/core';
import { CompetitionConstantsInterface, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { sortByName } from '../../utils/functions/utils.functions';
import { ErrorService } from '../error.service';
import { JsonLoaderService } from '../json-loader.service';

@Injectable({
	providedIn: 'root'
})
export class WyscoutCompetitionsConstantsService implements CompetitionConstantsInterface {
	readonly #translateService = inject(TranslateService);
	readonly #jsonLoaderService = inject(JsonLoaderService);
	readonly #errorService = inject(ErrorService);

	private competitionsJson: any;
	private areasJson: any;

	public initCompetitionList(): Observable<object> {
		const competitions$ = this.#jsonLoaderService.loadJson('wyscoutCompetitions', 'json');
		competitions$.subscribe({
			next: res => {
				this.competitionsJson = res;
			},
			error: (error: Error) => this.#errorService.handleError(error)
		});
		return competitions$;
	}

	public initAreasList(): Observable<object> {
		const wyscoutArea$ = this.#jsonLoaderService.loadJson('wyscoutAreas', 'json');
		wyscoutArea$.subscribe({
			next: res => (this.areasJson = res),
			error: (error: Error) => this.#errorService.handleError(error)
		});
		return wyscoutArea$;
	}

	public getCompetitions(): SelectItem[] {
		const mappedCompetitions: SelectItem<string>[] = (this.competitionsJson || []).map((competition: any) => ({
			label: `${competition.area.name} - ${competition.name}`,
			value: competition.wyId
		}));

		return sortBy(mappedCompetitions, 'label');
	}

	public getCompetitionFromJson(id: number | string) {
		return this.competitionsJson.find((competition: any) => String(competition.wyId) === String(id));
	}

	public getCompetitionName(value: string, season: TeamSeason) {
		const { wyscoutNationalLeague, wyscoutNationalCup, wyscoutTournamentQualifiers, wyscoutTournamentFinalStages } =
			season;
		if (value === 'nationalLeague') {
			return wyscoutNationalLeague
				? this.getCompetitionFromJson(wyscoutNationalLeague).name
				: this.#translateService.instant(value);
		}
		if (value === 'nationalCup') {
			return wyscoutNationalCup
				? this.getCompetitionFromJson(wyscoutNationalCup).name
				: this.#translateService.instant(value);
		}
		if (value === 'tournamentQualifiers') {
			return wyscoutTournamentQualifiers
				? this.getCompetitionFromJson(wyscoutTournamentQualifiers).name
				: this.#translateService.instant(value);
		}
		if (value === 'tournamentFinalStages') {
			return wyscoutTournamentFinalStages
				? this.getCompetitionFromJson(wyscoutTournamentFinalStages).name
				: this.#translateService.instant(value);
		}
		return '';
	}

	getCompetitionsByAreas(areaIds: string[]): SelectItem[] {
		const areas = this.areasJson
			.filter(({ id }) => areaIds && areaIds.length > 0 && areaIds.includes(id))
			.map(({ name }) => name);

		const competitionsByArea = this.competitionsJson
			.filter(({ area }) => (areaIds && areaIds.includes(area.id)) || (areas && areas.includes(area.name)))
			.map(({ name: label, wyId: value }) => ({ label, value }));

		return sortByName(competitionsByArea, 'label');
	}

	getAllAreaIds(): SelectItem[] {
		return sortBy(this.areasJson, 'name').map(x => ({ label: x.name, value: x.id }));
	}
}
