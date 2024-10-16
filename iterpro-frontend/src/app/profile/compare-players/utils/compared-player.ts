import { Player, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, getLimb, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import createSelectable from './selectable-player-factory';

export default class ComparedPlayer {
	selected: any = null;
	defaultPlayers: any = [];
	searchPlayers: Player[] = [];
	performanceMetrics: any = [];
	tacticalMetrics: any = [];
	attributes: any = null;
	robustness: any = null;
	allSeasons: TeamSeason[] = [];
	private seasons: TeamSeason[] = [];
	season: TeamSeason = null;
	azureUrlPipe: AzureStoragePipe;
	currency: string;

	constructor(currency: string) {
		this.currency = currency;
		this.setSelected = this.setSelected.bind(this);
	}

	setSelected(selected) {
		this.selected = selected;
		this.updateSeason();
	}

	hasPlayers() {
		return this.defaultPlayers.filter(({ player }) => player).length > 0;
	}

	setFirstSelected() {
		const first = this.defaultPlayers.find(({ player }) => player);
		if (first) this.setSelected(first);
		this.updateSeason();
	}

	setSecondOrFirstSelected() {
		const players = this.defaultPlayers.filter(({ player }) => player);
		if (players.length > 1) this.setSelected(players[1]);
		else if (players.length > 0) this.setSelected(players[0]);
	}

	updateSeason() {
		if (this.selected && this.selected.player) {
			const id = this.selected.player.id;
			const hasPlayer = season =>
				(season.playerIds || []).indexOf(id) >= 0 && season.teamId === this.selected.player.teamId;
			this.seasons = this.allSeasons.filter(hasPlayer);
			// .map(x => ({
			// 	...x,
			// 	label: `${x.name}${this.selected && this.selected.team ? ` - ${this.selected.team.name}` : ``}`
			// }));
			const first =
				this.seasons.length &&
				this.seasons.find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
				);
			if (first) this.setSeason(first);
		}
	}

	setSeason(season) {
		this.season = season;
	}

	setDefaultPlayers(team, players, defaultIndex = 0) {
		const withTeam = players.map(player => createSelectable(player, team));
		this.defaultPlayers = [...this.defaultPlayers, { team, isTeam: true }, ...withTeam];
	}

	toReport(t, azureUrlPipe, millionsPipe, numberPipe, sportType) {
		const player = this.selected.player;
		const team = this.selected.team;
		return {
			player: player.displayName,
			image: azureUrlPipe.transform(player.downloadUrl),
			season: this.season.name,
			profile: [
				{ label: t('Team'), value: team.name.toUpperCase() },
				{ label: t('profile.overview.nationality'), value: player.nationality },
				{
					label: t('profile.overview.birth'),
					value: moment(player.birthDate).format(getMomentFormatFromStorage())
				},
				{ label: t(`profile.position.${getLimb(sportType)}`), value: t(`foot.${player.foot}`) },
				{ label: t('profile.overview.height'), value: player.height || '-' },
				{ label: t('profile.overview.weight'), value: player.weight || '-' },
				{ label: t('profile.position'), value: t(player.position) },
				{
					label: t('profile.contract.playerValue'),
					value: player.monthlyWage
						? `${this.currency}${millionsPipe.transform(numberPipe.transform(player.marketValue, '0.0-3'), true)}`
						: '-'
				},
				{
					label: t('profile.overview.monthlyWage'),
					value: player.monthlyWage
						? `${this.currency}${millionsPipe.transform(numberPipe.transform(player.monthlyWage, '0.0-3'), true)}`
						: '-'
				},
				{
					label: t('profile.overview.contractUntil'),
					value: player.contractExpiry ? moment(player.contractExpiry).format(getMomentFormatFromStorage()) : ''
				}
			]
		};
	}
}
