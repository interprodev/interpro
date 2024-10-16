import { Injectable, inject } from '@angular/core';
import { ClubSeason, ClubSeasonApi, Team, TeamApi, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { ConstantService, CurrencyType } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentTeam } from '../models/auth.interfaces';

@Injectable({
	providedIn: 'root'
})
export class CurrentTeamService {
	readonly #teamApi = inject(TeamApi);
	readonly #constantService = inject(ConstantService);
	readonly #clubSeasonApi = inject(ClubSeasonApi);

	private team!: Team;
	private season!: TeamSeason;
	currentTeam$: Subject<CurrentTeam> = new Subject<CurrentTeam>();

	initTeamObserver(teamObserver: Observable<Team>) {
		teamObserver.subscribe({ next: team => this.updateSelectedTeam(team) });
	}
	initSeasonObserver(seasonObserver: Observable<TeamSeason>) {
		seasonObserver.subscribe({ next: season => this.updateSelectedSeason(season) });
	}

	private updateSelectedTeam(team: Team) {
		this.team = { ...team };
	}
	private updateSelectedSeason(season: TeamSeason) {
		this.season = { ...season };
	}

	setCurrentTeam(team: Team) {
		this.team = team;
		const season = this.todaySeason(team) as TeamSeason;
		const currentTeam: CurrentTeam = { team, season };
		this.currentTeam$.next(currentTeam);
	}

	setCurrentSeason(season: TeamSeason) {
		this.season = season;
		const currentTeam: CurrentTeam = { team: this.team, season };
		this.currentTeam$.next(currentTeam);
	}

	getCurrentTeam(): Team {
		return this.team;
	}

	getCurrentSeason(): TeamSeason | undefined {
		return this.season ? this.season : this.team.teamSeasons ? this.todaySeason(this.team) : undefined;
	}

	downloadCurrentTeam(teamId: string, teamSeasonId: string): Observable<Team> {
		return this.#teamApi.findById<Team>(teamId, { include: ['club', 'teamSeasons'] }).pipe(
			map((res: Team) => {
				this.team = res;
				this.season = (teamSeasonId ? this.getSeasonById(teamSeasonId) : this.todaySeason(res)) as TeamSeason;
				const currentTeam: CurrentTeam = { team: this.team, season: this.season };
				this.currentTeam$.next(currentTeam);

				return res;
			})
		);
	}

	extractSeason(seasons: TeamSeason[], date?: Date): TeamSeason | undefined {
		const found = this.season && (seasons || []).find(({ id }) => id === this.season.id);
		if (found) return found;
		return seasons.find(({ offseason, inseasonEnd }) =>
			moment(date ? date : undefined).isBetween(moment(offseason), moment(inseasonEnd))
		);
	}

	getSeasonAtDate(date: Date): TeamSeason | undefined {
		return this.team.teamSeasons.find(x => moment(date).isBetween(moment(x.offseason), moment(x.inseasonEnd)));
	}

	getSeasonById(teamSeasonId: string): TeamSeason | undefined {
		return this.team.teamSeasons.find(x => x.id === teamSeasonId);
	}

	todaySeason(team: Team): TeamSeason | undefined {
		return team.teamSeasons.find(x => moment().isBetween(moment(x.offseason), moment(x.inseasonEnd), 'day', '[]'));
	}

	getCurrency(): string {
		return this.#constantService.getCurrencySymbol(this.getCurrencyCode());
	}

	getCurrencyCode(): CurrencyType {
		return this.team && this.team.club ? (this.team.club.currency as CurrencyType) : 'EUR';
	}

	getClubSeasons(clubId: string): Observable<ClubSeason[]> {
		return this.#clubSeasonApi.find({
			where: { clubId }
		});
	}

	getDefaultTeamSeasonData(baseDate?: Date): any { // TODO remove when new team settings will be implemented and the old module will be removed
		const baseYear = baseDate && moment(baseDate).year() < 7 ? moment(baseDate).year() - 1 : moment(baseDate).year();
		return {
			name: 'new season',
			offseason: moment({
				year: baseYear,
				month: 6,
				day: 1
			}).toDate(),
			preseason: moment({
				year: baseYear,
				month: 6,
				day: 10
			}).toDate(),
			inseasonStart: moment({
				year: baseYear,
				month: 7,
				day: 15
			}).toDate(),
			inseasonEnd: moment({
				year: baseYear + 1,
				month: 5,
				day: 30
			}).toDate()
		};
	}
}
