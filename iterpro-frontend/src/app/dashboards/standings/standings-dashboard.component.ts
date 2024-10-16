import { Component, OnInit } from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { MatchProviderStats, SDKStorage, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	ErrorService,
	ProviderIntegrationService,
	ReportService,
	ThirdPartyMatch,
	getMomentFormatFromStorage,
	getScore,
	getScorers,
	getStats,
	isNotNull,
	toDisplayScorers,
	BlockUiInterceptorService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { capitalize, isEmpty } from 'lodash';
import * as moment from 'moment';
import { Observable, forkJoin, of } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';
import { SeasonStoreSelectors } from '../../+state';
import { RootStoreState } from '../../+state/root-store.state';
import { TopbarStoreActions } from '../../+state/topbar-store';

@UntilDestroy()
@Component({
	templateUrl: './standings-dashboard.component.html',
	styleUrls: ['./standings-dashboard.component.css']
})
export class StandingsDashboardComponent implements OnInit {
	data: any;
	selected: MatchProviderStats = null;
	list: ThirdPartyMatch[] = [];
	currentSeason: TeamSeason;
	currentTeam: Team;
	competitions: any;
	competitionsSeason: any;
	isLoading = true;
	constructor(
		private error: ErrorService,
		private alertService: AlertService,
		private reportService: ReportService,
		private translate: TranslateService,
		private providerIntegrationService: ProviderIntegrationService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private store$: Store<RootStoreState>,
		storageService: SDKStorage
	) {
		storageService.remove('TOPBAR_STATE');
		this.store$.dispatch(TopbarStoreActions.setTopbarStatus({ visible: true }));
	}

	ngOnInit(): void {
		this.store$
			.select(AuthSelectors.selectTeam)
			.pipe(untilDestroyed(this))
			.subscribe((team: Team) => {
				this.currentTeam = team;
				this.init();
			});

		this.store$
			.select(SeasonStoreSelectors.selectDefault)
			.pipe(untilDestroyed(this))
			.subscribe((season: TeamSeason) => {
				this.currentSeason = season;
				this.init();
			});
	}

	private init() {
		this.isLoading = true;
		if (
			this.providerIntegrationService.getSeasonThirdPartyNationalLeague(this.currentSeason) &&
			this.providerIntegrationService.getThirdPartyTeamId(this.currentTeam)
		) {
			this.getData()
				.pipe(untilDestroyed(this), first(), filter(isNotNull))
				.subscribe({
					next: matchDetails => this.onMatchDetailReceived(matchDetails),
					error: (error: Error) => this.thirdPartyError(error)
				});
		}
	}

	private getCurrentNationalLeague(season: TeamSeason): number {
		return this.currentTeam.providerTeam === 'Wyscout' ? season.wyscoutNationalLeague : season.instatNationalLeague;
	}

	private getData(): Observable<any> {
		const currentCompetition = this.currentSeason.competitionInfo.find(
			({ competition }) => competition === this.getCurrentNationalLeague(this.currentSeason)
		);
		this.competitions = currentCompetition.competition;
		this.competitionsSeason = currentCompetition.season;
		if (currentCompetition && currentCompetition.competition && currentCompetition.season) {
			return this.blockUiInterceptorService
				.disableOnce(
					forkJoin([
						this.providerIntegrationService.getStandingsLeaderboard(currentCompetition),
						this.providerIntegrationService.getStandingsMatchList(this.currentTeam, currentCompetition)
					])
				)
				.pipe(
					switchMap(([leaderboard, matchList]) => {
						if (leaderboard.length === 0 && matchList.length === 0) {
							this.alertService.notify('info', 'home.dashboard', 'alert.noMatchFound');
							return of(null);
						} else {
							this.list = matchList;
							this.data = leaderboard;
							const filtered = matchList
								.filter(({ matchInfo }) => moment(matchInfo.dateutc).isSameOrBefore(moment()))
								.reverse();
							const match: ThirdPartyMatch = filtered.length > 0 && filtered[0] ? filtered[0] : matchList[0];
							return this.selected ? of(this.selected) : this.providerIntegrationService.getStandingsMatchStats(match);
						}
					})
				);
		}

		return of(null);
	}

	private thirdPartyError(error: Error) {
		// eslint-disable-next-line no-console
		!!error && error.name !== 'EmptyError' ? this.error.handleError(error) : console.error(error);
	}

	onClickMatch(match: ThirdPartyMatch) {
		this.isLoading = true;
		this.blockUiInterceptorService
			.disableOnce(this.providerIntegrationService.getStandingsMatchStats(match))
			.pipe(untilDestroyed(this), first())
			.subscribe({
				next: (matchDetails: MatchProviderStats) => this.onMatchDetailReceived(matchDetails),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onMatchDetailReceived(match: MatchProviderStats) {
		this.selected = match;
		this.isLoading = false;
	}

	resync() {
		this.isLoading = true;
		this.blockUiInterceptorService
			.disableOnce(this.providerIntegrationService.resync())
			.pipe(
				untilDestroyed(this),
				switchMap(() => this.getData())
			)
			.subscribe({
				next: matchDetails => this.onMatchDetailReceived(matchDetails),
				error: (error: Error) => this.thirdPartyError(error)
			});
	}

	// This method is used check for displaying a warning message if currentSeason/currentTeam/wyscoutId/competitions etc are not found.
	isValidStandings() {
		if (
			this.providerIntegrationService.provider !== 'Dynamic' &&
			this.providerIntegrationService.getSeasonThirdPartyNationalLeague(this.currentSeason) &&
			this.providerIntegrationService.getThirdPartyTeamId(this.currentTeam) &&
			this.competitions &&
			this.competitionsSeason
		) {
			return true;
		} else {
			return false;
		}
	}

	isEmpty(data) {
		return isEmpty(data);
	}

	// The text is displayed when  no valid wyscout id exist or No national league or wyscout team id set.
	getMessageForMissingWyscoutData() {
		if (!this.currentSeason) {
			return this.translate.instant('wyscout.dashboard.missingWyscoutData');
		} else if (!this.currentTeam?.wyscoutId) {
			return this.translate.instant('wyscout.dashboard.WrongWyscoutId');
		} else if (!this.competitions) {
			return this.translate.instant('wyscout.dashboard.missingCompetitions');
		} else if (!this.competitionsSeason) {
			return this.translate.instant('wyscout.dashboard.missingCompetitionsSeason');
		}
	}

	// Redirecting to club setting if teamseason/player in team not found.
	getClubSettingsLink() {
		const url = '/settings/club-preferences/general';
		const params = {};
		return [url, params];
	}

	// The text is dispalayed when a) No team season found b) Team season found but no player in it.
	getRedirectText() {
		return this.translate.instant('redirect.to.clubsettings.text');
	}

	downloadMatchReportCSV() {
		const t = this.translate.instant.bind(this.translate);
		const score = getScore(this.selected);
		let homeScorers = getScorers(this.selected.match, this.selected.home, false);
		homeScorers = [...homeScorers, ...getScorers(this.selected.match, this.selected.away, true)];
		const hs = toDisplayScorers(homeScorers, t).replace(/(\r\n|\n|\r| {2})/g, '');
		let awayScorers = getScorers(this.selected.match, this.selected.away, false);
		awayScorers = [...awayScorers, ...getScorers(this.selected.match, this.selected.home, true)];
		const as = toDisplayScorers(awayScorers, t).replace(/(\r\n|\n|\r| {2})/g, '');
		const stats = getStats(this.selected);

		const table = [
			['', this.selected.home.name, this.selected.away.name],
			[t('event.game.score'), ...score],
			[t('goals'), hs, as],
			...stats.map(i => [t(i.item.label), i.home, i.away])
		];
		this.reportService.getReportCSV('Match', table);
	}

	downloadMatchReportPDF() {
		const t = this.translate.instant.bind(this.translate);
		const currentLang = this.translate.currentLang;

		const score = getScore(this.selected);
		let homeScorers = getScorers(this.selected.match, this.selected.home, false);
		homeScorers = [...homeScorers, ...getScorers(this.selected.match, this.selected.away, true)];
		const hs = toDisplayScorers(homeScorers, t).replace(/(\r\n|\n|\r| {2})/g, '');
		let awayScorers = getScorers(this.selected.match, this.selected.away, false);
		awayScorers = [...awayScorers, ...getScorers(this.selected.match, this.selected.home, true)];
		const as = toDisplayScorers(awayScorers, t).replace(/(\r\n|\n|\r| {2})/g, '');

		const date = capitalize(
			this.reportService.date(moment(this.selected.match.dateutc).toDate(), 'fullDate', currentLang)
		);
		const competition = this.data.competition ? this.data.competition.name : '';
		const home = {
			image: this.selected && this.selected.home && this.selected.home.imageDataURL,
			scorers: hs,
			goals: score[0]
		};
		const away = {
			image: this.selected && this.selected.away && this.selected.away.imageDataURL,
			scorers: as,
			goals: score[1]
		};

		const stats = getStats(this.selected).map(stat => ({ ...stat, item: t(stat.item.label) }));

		const data = {
			title: `${date} - ${competition.toUpperCase()}`,
			date,
			competition,
			home,
			away,
			stats
		};
		this.reportService.getReport('standings_match', data, 'positions.headCoach', null, `${this.selected.match.label}`);
	}

	downloadLeaderboardReportCSV() {
		const t = this.translate.instant.bind(this.translate);
		const header = [
			'',
			t('dashboard.leaderboard.team'),
			t('dashboard.leaderboard.totalPlayed.tooltip'),
			t('dashboard.leaderboard.wins.tooltip'),
			t('dashboard.leaderboard.draws.tooltip'),
			t('dashboard.leaderboard.losses.tooltip'),
			t('dashboard.leaderboard.goalsFor.tooltip'),
			t('dashboard.leaderboard.goalsAgainst.tooltip'),
			t('dashboard.leaderboard.points.tooltip')
		];
		const rows = this.data.teams.map((team, i) => [
			i + 1,
			team.team.name,
			team.totalPlayed,
			team.totalWins,
			team.totalDraws,
			team.totalLosses,
			team.totalGoalsFor,
			team.totalGoalsAgainst,
			team.totalPoints
		]);
		const table = [header, ...rows];
		const name = this.data && this.data.competition ? this.data.competition.name : '';
		this.reportService.getReportCSV(name, table);
	}

	downloadLeaderboardReportPDF() {
		const t = this.translate.instant.bind(this.translate);
		const headers = [
			{ value: '' },
			{ value: t('dashboard.leaderboard.team'), colspan: 2 },
			{ value: t('dashboard.leaderboard.totalPlayed.tooltip') },
			{ value: t('dashboard.leaderboard.wins.tooltip') },
			{ value: t('dashboard.leaderboard.draws.tooltip') },
			{ value: t('dashboard.leaderboard.losses.tooltip') },
			{ value: t('dashboard.leaderboard.goalsFor.tooltip') },
			{ value: t('dashboard.leaderboard.goalsAgainst.tooltip') },
			{ value: t('dashboard.leaderboard.points.tooltip') }
		];
		const rows = this.data.teams.map((team, i) => {
			const selected = team.teamId === this.providerIntegrationService.getThirdPartyTeamId(this.currentTeam);
			return {
				selected,
				items: [
					{ value: i + 1 },
					{ value: team.team.imageDataURL, type: 'image' },
					{ value: team.team.name },
					{ value: team.totalPlayed },
					{ value: team.totalWins },
					{ value: team.totalDraws },
					{ value: team.totalLosses },
					{ value: team.totalGoalsFor },
					{ value: team.totalGoalsAgainst },
					{ value: team.totalPoints }
				]
			};
		});
		const name = this.data && this.data.competition ? this.data.competition.name : '';
		const title = `${t('dashboard.leadeboard')} - ${name.toUpperCase()}`;
		const table = { title, headers, rows };
		this.reportService.getReport(
			'standings_leaderboard',
			table,
			'',
			null,
			`${name} ${moment().startOf('day').format(getMomentFormatFromStorage())}`
		);
	}
}
