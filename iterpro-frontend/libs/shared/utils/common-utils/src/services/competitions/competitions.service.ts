import { Injectable, inject } from '@angular/core';
import {
	CompetitionConstantsInterface,
	CompetitionProviders,
	InstatCompetitionJson,
	ProviderType,
	Team,
	TeamSeason,
	WyscoutCompetitionJson
} from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { ProviderService } from '../providers/provider.service';
import { InstatCompetitionsConstantsService } from './instat.competitions.service';
import { WyscoutCompetitionsConstantsService } from './wyscout.competitions.service';

@Injectable({
	providedIn: 'root'
})
export class CompetitionsConstantsService implements CompetitionConstantsInterface {
	readonly #wyscoutService = inject(WyscoutCompetitionsConstantsService);
	readonly #instatService = inject(InstatCompetitionsConstantsService);
	readonly #providerService = inject(ProviderService);

	private readonly providers: CompetitionProviders = { Wyscout: this.#wyscoutService, InStat: this.#instatService };
	private currentCompetitionProvider!: CompetitionConstantsInterface;

	initTeamObserver(teamObserver: Observable<Team>): void {
		teamObserver.subscribe({ next: team => this.updateTeam(team) });
	}

	private updateTeam(team: Team): void {
		this.currentCompetitionProvider = team.club.b2cScouting ? this.withProvider('Wyscout') : this.withTeam(team);
	}

	// methods to access provider that is different from the team one (like in Club Settings)
	withTeam(team: Team): CompetitionConstantsInterface {
		return this.withProvider(this.#providerService.getProviderType(team));
	}

	withProvider(provider: ProviderType): CompetitionConstantsInterface {
		return this.getProvider(provider);
	}

	getAllAreaIdsForProvider(provider: ProviderType): SelectItem[] {
		return this.getProvider(provider) ? this.getProvider(provider).getAllAreaIds() : [];
	}

	// CompetitionConstantsInterface methods that points to the current team provider
	initCompetitionList(): void {
		return this.currentCompetitionProvider.initCompetitionList();
	}

	initAreasList(): void {
		return this.currentCompetitionProvider.initAreasList();
	}

	getCompetitions(): SelectItem[] {
		return this.currentCompetitionProvider ? this.currentCompetitionProvider.getCompetitions() : [];
	}

	getCompetitionFromJson(id: number | string): InstatCompetitionJson | WyscoutCompetitionJson {
		return this.currentCompetitionProvider?.getCompetitionFromJson(id);
	}

	getCompetitionName(value: string, season: TeamSeason) {
		const jsonCompetition = this.getCompetitionFromJson(value);
		if (jsonCompetition) return jsonCompetition.name;

		const found = season.competitionInfo.find((info: any) => info.competition === value);
		if (found) return found.name;

		return this.currentCompetitionProvider ? this.currentCompetitionProvider.getCompetitionName(value, season) : value;
	}

	getCompetitionsByAreas(areaIds: string[]): SelectItem[] {
		return this.currentCompetitionProvider ? this.currentCompetitionProvider.getCompetitionsByAreas(areaIds) : [];
	}

	getAllAreaIds(): SelectItem[] {
		return this.currentCompetitionProvider ? this.currentCompetitionProvider.getAllAreaIds() : [];
	}

	private getProvider(provider: ProviderType): CompetitionConstantsInterface {
		switch (provider) {
			case 'Wyscout':
				return this.providers.Wyscout;
			case 'InStat':
				return this.providers.InStat;
			default:
				return this.providers.Wyscout;
		}
	}

	public getCompetition(compId: number | string) {
		return this.getCompetitions().find(({ value }) => compId === value);
	}
}
