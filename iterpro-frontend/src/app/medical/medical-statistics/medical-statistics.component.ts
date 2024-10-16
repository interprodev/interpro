import { Component, OnInit } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Event,
	EventApi,
	LoopBackAuth,
	MedicalTreatment,
	MedicalTreatmentApi,
	Player, TeamGroup,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import {
	ErrorService,
	INJURY_STATUSES,
	PRIMARIES,
	ReportService,
	clearAndCopyCircularJSON,
	copyValue,
	diffDays,
	formatLabel,
	getDataLabels,
	getDefaultCartesianConfig,
	getDefaultPieConfig,
	getPlayersById,
	isGroup,
	isNotArchived,
	isNotEmpty,
	sortByDate,
	sortByName,
	today
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import chroma from 'chroma-js';
import { saveAs } from 'file-saver';
import { flatten, groupBy, isArray, map, sortBy, sum, uniq, unzip } from 'lodash';
import { transpose } from 'mathjs';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { first } from 'rxjs/operators';
import fields from './utils/items';
import { forkJoin, Observable } from 'rxjs';
import { playersConditions } from './utils/api';

const getCounter = (fieldMap, field, number?) => {
	if (!field) field = 'Undefined';
	const counter = fieldMap.get(field);
	number = !number ? 1 : number;
	if (!counter) {
		fieldMap.set(field.toString(), 1);
	} else {
		fieldMap.set(field.toString(), counter + number);
	}
	return fieldMap;
};

const getDiffDays = (injury, period) => {
	if (moment(injury.date).isSameOrAfter(moment(period[0]))) {
		if (!injury.endDate || (injury.endDate && moment(injury.endDate).isAfter(period[1]))) {
			return diffDays(moment(period[1]).toDate(), moment(injury.date).toDate());
		} else {
			return diffDays(moment(injury.endDate).toDate(), moment(injury.date).toDate());
		}
	} else {
		if (!injury.endDate || (injury.endDate && moment(injury.endDate).isAfter(period[1]))) {
			return diffDays(moment(period[1]).toDate(), moment(period[0]).toDate());
		} else {
			return diffDays(moment(injury.endDate).toDate(), moment(period[0]).toDate());
		}
	}
};

@UntilDestroy()
@Component({
	selector: 'iterpro-medical-statistics',
	templateUrl: './medical-statistics.component.html',
	styles: [`::ng-deep .p-datatable.p-datatable-scrollable td.p-frozen-column {
      width: 16%;}`],
})
export class MedicalStatisticsComponent implements OnInit {
	games: Event[];
	trainings: Event[];
	data: any;
	options: any;
	period: Date[] = null;
	today: Date;
	days: number;
	trainingCounter: number;
	gameCounter: number;
	players: Player[] = [];
	selectedPlayers: Player[];
	metrics: any[] = [];
	selectedMetric: any;
	labels: string[];
	chart: any;
	showHelper = false;
	medicalTreatments: MedicalTreatment[] = [];
	legend: any[] = [
		{
			label: 'medical.statistics.items.daysMissedInjury',
			tooltip: 'medical.statistics.items.daysMissedInjury.description'
		},
		{
			label: 'medical.statistics.items.daysAbsenceOccurrence',
			tooltip: 'medical.statistics.items.daysAbsenceOccurrence.description'
		},
		{
			label: 'medical.statistics.items.daysPerStage',
			tooltip: 'medical.statistics.items.daysPerStage.description'
		},
		{
			label: 'medical.statistics.items.injuryRate',
			tooltip: 'medical.statistics.items.injuryRate.description'
		},

		{
			label: 'medical.statistics.items.nInjuries',
			tooltip: 'medical.statistics.items.nInjuries.description'
		},
		{
			label: 'medical.statistics.items.nCategory',
			tooltip: 'medical.statistics.items.nCategory.description'
		},
		{
			label: 'medical.statistics.items.nContact',
			tooltip: 'medical.statistics.items.nContact.description'
		},
		{
			label: 'medical.statistics.items.nLocation',
			tooltip: 'medical.statistics.items.nLocation.description'
		},
		{
			label: 'medical.statistics.items.nMechanism',
			tooltip: 'medical.statistics.items.nMechanism.description'
		},
		{
			label: 'medical.statistics.items.nOccurrence',
			tooltip: 'medical.statistics.items.nOccurrence.description'
		},
		{
			label: 'medical.statistics.items.nPosition',
			tooltip: 'medical.statistics.items.nPosition.description'
		},
		{
			label: 'medical.statistics.items.nSeverity',
			tooltip: 'medical.statistics.items.nSeverity.description'
		},
		{
			label: 'medical.statistics.items.nSystem',
			tooltip: 'medical.statistics.items.nSystem.description'
		},
		{
			label: 'medical.statistics.items.nType',
			tooltip: 'medical.statistics.items.nType.description'
		},
		{
			label: 'medical.statistics.items.reInjuryRate',
			tooltip: 'medical.statistics.items.reInjuryRate.description'
		},
		{
			label: 'medical.statistics.items.nTreatments',
			tooltip: 'medical.statistics.items.nTreatments.description'
		},
		{
			label: 'medical.statistics.items.treatmentsByLocation',
			tooltip: 'medical.statistics.items.treatmentsByLocation.description'
		}
	];

	palette = [
		'#ffa600',
		'#f95d6a',
		'#d45087',
		'#a05195',
		'#665191',
		'#2f4b7c',
		'#003f5c',
		'#FF8C00',
		'#018574',
		'#7f8c8d',
		'#9b59b6',
		'#847545',
		'#00B7C3'
	];

	paletteBorder = [
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)'
	];

	playerMap: Map<string, Player>;
	datalabels = false;

	//TABLE STATS
	headers: string[];
	rows: string[][];

	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		private teamSeasonApi: TeamSeasonApi,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private translate: TranslateService,
		private report: ReportService,
		private es: EventApi,
		private currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(
				{
					next: (translations) => {
						this.today = today();
						let day = this.today;
						// If I'm seeing an older season, I'll take as reference for date period the end of that season, otherwise I'll take today
						if (
							!moment().isBetween(
								this.currentTeamService.getCurrentSeason().offseason,
								this.currentTeamService.getCurrentSeason().inseasonEnd
							)
						)
							day = this.currentTeamService.getCurrentSeason().inseasonEnd;
						this.period = [moment(day).subtract(1, 'month').startOf('day').toDate(), moment(day).startOf('day').toDate()];
						this.days = moment(this.period[1]).add(1, 'day').diff(this.period[0], 'day');
						this.metrics = fields['metrics'];
						this.metrics.forEach(x => (x.label = this.translate.instant(x.value)));
						this.metrics = sortByName(this.metrics, 'label');
						this.getData(this.period);
					}
				}
			);
	}

	onChangePeriod(e) {
		if (this.period[1]) {
			this.days = moment(this.period[1]).add(1, 'day').diff(this.period[0], 'day');
			this.getData(this.period);
		}
	}

	onChangePlayers(e) {
		this.selectedPlayers = e.value;
		this.mapPlayers(sortByName(this.selectedPlayers, 'displayName'));
	}

	onChangeMetrics(e) {
		this.extractMetric(this.selectedMetric, this.playerMap);
	}

	getData(period) {
		const season = this.currentTeamService.getCurrentSeason();
		const obsP: Observable<Player[]> = this.teamSeasonApi.getPlayers(
			season.id,
			playersConditions(this.period[0], moment(this.period[1]).add(1, 'day').toDate())
		);
		const obsG: Observable<TeamGroup[]> = this.teamSeasonApi.getGroups(season.id, { order: 'name DESC' });
		const obsE: Observable<Event[]> = this.es.findEventsForMedicalStats(
			this.auth.getCurrentUserData().currentTeamId,
			this.period[0],
			moment(this.period[1]).add(1, 'day').toDate()
		);
		forkJoin([obsP, obsG, obsE])
			.pipe(untilDestroyed(this))
			.subscribe(
				{
					next: (result: [Player[], TeamGroup[], Event[]]) => this.setData(result),
					error: (error) => this.error.handleError(error)
				}
			);
	}

	setData(result: [Player[], TeamGroup[], Event[]]) {
		this.players = sortByName(result[0], 'displayName');
		this.players = this.players.filter(player =>
			isNotArchived(player, {
				date: moment(this.period[0]).startOf('day').toDate()
			})
		);
		this.games = result[2].filter(({ format }) => format === 'game');
		this.gameCounter = this.games.length;
		this.trainings = result[2].filter(({ format }) => format === 'training');
		this.trainingCounter = this.trainings.length;
		this.players = this.addGroupToData(this.players, result[1]);
		if (!isNotEmpty(this.selectedPlayers))
			this.selectedPlayers = result[0].filter(({ id: resultId }) =>
				this.players.map(({ id }) => id).includes(resultId)
			);
		else {
			const ids = this.selectedPlayers.map(({ id }) => id);
			this.selectedPlayers = this.players.filter(({ id }) => ids.includes(id));
		}
		const medicalRequest$ = this.medicalTreatmentApi.find({
			where: {
				playerId: { inq: (this.selectedPlayers || []).map(({ id }) => id) }
			}
		});
		medicalRequest$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (result: MedicalTreatment[]) => {
				this.medicalTreatments = result;
				this.mapPlayers(this.selectedPlayers);
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	getPlayerIds(names) {
		return names.map(x => x.id);
	}

	addGroupToData(players, groups) {
		groups.forEach(x => {
			x.displayName = x.name;
			x.players = getPlayersById(x.players, this.players).filter(y => y);
		});
		groups.unshift({
			displayName: 'TEAM',
			name: 'TEAM',
			teamId: this.currentTeamService.getCurrentTeam().id,
			players: this.players
		});
		return [...groups, ...players];
	}

	mapPlayers(players: Player[]) {
		this.playerMap = new Map<string, Player>();
		players.forEach(player => {
			this.playerMap.set(player.id, player);
		});
		if (!this.selectedMetric) this.selectedMetric = this.metrics[0].value;
		this.extractMetric(this.selectedMetric, this.playerMap);
	}

	// method that extract one metric through the players dataset
	extractMetric(metric, playerMap: Map<string, Player>) {
		let categories = Array.from(playerMap.keys()).map(player => {
			const pl = this.players.find(({ id }) => id === player);
			if (pl) return pl.displayName;
		});
		const values = Array.from(playerMap.values());
		let dataset;
		switch (metric) {
			case 'medical.statistics.items.nInjuries': {
				dataset = this.nInjuries(values);
				this.labels = [
					this.translate.instant('medical.statistics.injuries'),
					this.translate.instant('medical.statistics.complaints'),
					this.translate.instant('medical.statistics.illnesses')
				];
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.daysMissedInjury': {
				dataset = this.getDaysMissedInjury(values, this.games, this.trainings);
				this.labels = [
					this.translate.instant('attendance.statistics.gamesMissedThroughInjury'),
					this.translate.instant('attendance.statistics.trainingMissedThroughInjury')
				];
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.injuryRate': {
				dataset = this.injuryRate(values, this.days, this.period);
				this.labels = ['Injury rate'];
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nSystem': {
				dataset = this.extractInjuryByField(values, 'system');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nIncidence': {
				dataset = this.extractInjuryByField(values, 'incidence');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nLocation': {
				dataset = this.extractInjuryByField(values, 'location');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nType': {
				dataset = this.extractInjuryByField(values, 'type');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nCategory': {
				dataset = this.extractInjuryByField(values, 'category');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nMechanism': {
				dataset = this.extractInjuryByField(values, 'mechanism');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nOccurrence': {
				dataset = this.extractInjuryByField(values, 'occurrence');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nSeverity': {
				dataset = this.extractInjuryByField(values, 'severity');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nContact': {
				dataset = this.extractInjuryByField(values, 'contact');
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.daysAbsenceOccurrence': {
				dataset = this.daysAbsenceOccurrence(values, this.period);
				this.labels = [
					this.translate.instant('medical.statistics.daysMissedGames'),
					this.translate.instant('medical.statistics.daysMissedTrainings'),
					this.translate.instant('medical.statistics.daysMissedOthers')
				];
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.reInjuryRate': {
				dataset = this.reinjuryRate(values, this.period);
				this.labels = [
					this.translate.instant('medical.statistics.reInjured'),
					this.translate.instant('medical.statistics.notReInjured')
				];
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nPosition': {
				let res = this.nPosition(values);
				res = this.sortTranslate(res);
				dataset = [Array.from(res.values())];
				categories = Array.from(res.keys());
				this.chart = 'doughnut';
				break;
			}
			case 'medical.statistics.items.daysPerStage': {
				dataset = this.daysPerStage(values, this.period);
				this.labels = INJURY_STATUSES.filter(status => status.visible).map(({ label }) =>
					this.translate.instant(label)
				);
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.nTreatments': {
				dataset = this.nTreatments(values, this.period);
				this.labels = [this.translate.instant('medical.statistics.treatments')];
				this.chart = 'bar';
				break;
			}
			case 'medical.statistics.items.treatmentsByLocation': {
				// this.labels = this.constService.getLocations().map((x) => this.translate.instant(x.value));
				dataset = this.locationsForTreatments(values, this.period);
				this.chart = 'bar';
				break;
			}
		}

		categories = categories.map(x => {
			if (!x) return this.translate.instant('Undefined');
			else return this.translate.instant(x);
		});

		this.data = this.getChartData(dataset, categories, metric);
		this.options = this.getChartOptions(metric);

		// TABLE STATS
		this.headers = this.data.datasets.map(({ label }) => label);
		this.rows = this.selectedPlayers.map((player, index) => [
			player.displayName,
			...this.data.datasets.map(({ data }) => data[index])
		]);
	}

	downloadReport() {
		const data = {
			...this.data,
			labels: this.data.labels.map(x => (isArray(x) ? x.join(' ') : x))
		};
		const report = {
			from: this.period[0],
			to: this.period[1],
			days: this.days,
			data: clearAndCopyCircularJSON(data),
			options: this.options,
			type: this.chart,
			metrics: this.translate.instant(this.selectedMetric),
			players: this.selectedPlayers.map(p => p.displayName)
		};
		this.report.getReport('medical_statistics', report, 'positions.HoM');
	}

	private sum(players, f, transp?, par?) {
		let agg = f(players, par);
		agg = transp ? transpose(agg) : agg;
		return agg.map(x => x.reduce((a, b) => a + b, 0));
	}

	private sumMap(players, f, transp?, par?) {
		const agg = f(players, par);
		return agg;
	}

	private avg(players, f, transp?, par1?, par2?) {
		let agg = f(players, par1, par2);
		agg = transp ? transpose(agg) : agg;
		return agg.map(x => x.reduce((a, b) => a + b, 0) / x.length);
	}

	// returns only an array composed of other 3 arrays corresponding to the labels in this.labels
	private nInjuries(values) {
		let counters = [];
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				counters = [...counters, this.sum(player.players, this.nInjuries, true)];
			} else {
				let injuries = 0;
				let complaints = 0;
				let illnesses = 0;
				player.injuries.forEach(x => {
					if (x.issue === 'medical.infirmary.details.issue.injury') injuries += 1;
					if (x.issue === 'medical.infirmary.details.issue.complaint') complaints += 1;
					if (x.issue === 'medical.infirmary.details.issue.illness') illnesses += 1;
				});
				counters = [...counters, [injuries, complaints, illnesses]];
			}
		});
		return counters;
	}

	private injuryRate(values, days, period) {
		let counters = [];
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				const agg = this.avg(player.players, this.injuryRate, false, days, period);
				counters = [...counters, agg];
			} else {
				const len = player.injuries.filter(
					x =>
						x.issue === 'medical.infirmary.details.issue.injury' &&
						moment(x.date).isBetween(moment(period[0]), moment(period[1]))
				).length;
				const rate = len / days;
				counters = [...counters, rate];
			}
		});
		return [counters];
	}

	private extractInjuryByField(values, field) {
		let keys = flatten(
			flatten(values.filter(x => !x.players).map(x => x.injuries))
				// .filter(x => !!x[field])
				.map(x => x[field])
		).sort();
		keys = uniq(keys);
		if (field === 'contact') keys = ['true', 'false'];
		let counter = [];
		if (isNotEmpty(values)) {
			values.forEach(player => {
				if (player.players && isGroup(player.players)) {
					const dataset = this.extractInjuryByField(player.players, field);
					counter = [...counter, map(unzip(dataset), sum)];
				} else {
					let localCounter = [];
					keys.forEach((x: any) => {
						let filtered;
						if (x === 'true' || x === 'false') x = x === 'true';
						if (field === 'type' || field === 'system') {
							filtered = player.injuries.filter(inj => inj[field] && inj[field].includes(x));
						} else {
							filtered =
								!x || x === 'undefined'
									? player.injuries.filter(inj => !inj[field])
									: player.injuries.filter(inj => inj[field] === x);
						}
						localCounter = [...localCounter, filtered.length];
					});
					counter = [...counter, localCounter];
				}
			});
			if (field === 'contact') keys = ['Contact', 'No Contact'];
			this.labels = keys.map(x =>
				x === 'undefined' || !x
					? this.translate.instant('medical.infirmary.injury.noCategory')
					: this.translate.instant(x)
			);
			return counter;
		}
	}

	private getPlayerMedicalTreatments(itemPlayerId: string): MedicalTreatment[] {
		return (this.medicalTreatments || []).filter(({ playerId }) => playerId === itemPlayerId);
	}

	private locationsForTreatments(values, period) {
		let keysPr = Object.keys(
			groupBy(flatten(values.filter(x => !x.players).map(x => this.getPlayerMedicalTreatments(x.id))), 'location')
		).sort();
		keysPr = keysPr.filter(x => x !== 'null');
		let counter = [];
		if (isNotEmpty(values)) {
			values.forEach((player, index) => {
				let localCounter = [];
				keysPr.forEach((x: any) => {
					let filtered;
					const playerTreatments = this.getPlayerMedicalTreatments(player.id);
					filtered =
						!x || x === 'undefined'
							? playerTreatments.filter(inj => !inj['location'])
							: playerTreatments.filter(inj => inj['location'] === x);
					filtered = filtered.filter(y => moment(y.date).isBetween(moment(period[0]), moment(period[1]), 'days', '[]'));
					localCounter = [...localCounter, filtered.length];
				});
				counter = [...counter, localCounter];
			});
			this.labels = keysPr.map(x =>
				x === 'undefined' ? this.translate.instant('Undefined') : this.translate.instant(x)
			);
			return counter;
		}
	}

	private reinjuryRate(values, period) {
		let counters = [];
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				counters = [...counters, this.avg(player.players, this.reinjuryRate, true, period)];
			} else {
				let yes = 0;
				let no = 0;
				const inj = player.injuries.filter(
					x =>
						x.issue === 'medical.infirmary.details.issue.injury' &&
						moment(x.date).isBetween(moment(period[0]), moment(period[1]))
				);
				const len = inj.length;
				inj.forEach(x => {
					if (!x.reinjury || (x.reinjury && x.reinjury === false)) no += 1;
					else yes += 1;
				});
				counters = [...counters, [yes, no]];
			}
		});
		return counters;
	}

	private nPosition(values) {
		let fieldMap = new Map<string, number>();
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				fieldMap = this.sumMap(player.players, this.nPosition, false);
			} else {
				if (isNotEmpty(player.injuries)) {
					fieldMap = getCounter(fieldMap, player['position'], player.injuries.length);
				}
			}
		});
		return fieldMap;
	}

	private daysPerStage(values, period) {
		let counter = [];
		const fieldMap = new Map<string, number>();
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				counter = [...counter, this.avg(player.players, this.daysPerStage, true, period)];
			} else {
				INJURY_STATUSES.filter(status => status.visible).forEach(({ label }) => fieldMap.set(label, 0));
				player.injuries.forEach(injury => {
					for (let _i = 0; _i < injury.statusHistory.length; _i++) {
						const filtered = injury.statusHistory[_i];
						if (
							filtered.phase !== 'medical.infirmary.details.statusList.healed' &&
							moment(filtered.date).isBetween(period[0], period[1], 'day', '[]')
						) {
							if (_i > 0 && moment(injury.statusHistory[_i - 1].date).isBefore(period[0])) {
								const temp = fieldMap.get(injury.statusHistory[_i - 1].phase);
								const diff2 = diffDays(moment(filtered.date).startOf('day').toDate(), period[0]);
								fieldMap.set(injury.statusHistory[_i - 1].phase, temp + diff2);
							}
							const c = fieldMap.get(filtered.phase);
							const secondDate = injury.statusHistory[_i + 1]
								? moment(injury.statusHistory[_i + 1].date).startOf('day')
								: moment().add(1, 'day').startOf('day');
							const diff = diffDays(secondDate, moment(filtered.date).startOf('day').toDate());
							fieldMap.set(filtered.phase, c + diff);
						}
					}
				});
				if (player.injuries.length > 0) {
					fieldMap.forEach((vals, keys) => {
						vals = vals / player.injuries.length;
						fieldMap.set(keys, vals);
					});
				}
				const arr = Array.from(fieldMap.values());
				counter = [...counter, arr];
			}
		});
		return counter;
	}

	private nTreatments(values, period) {
		let counters = [];
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				counters = [...counters, this.sum(player.players, this.nTreatments, false, period)];
			} else {
				let counter = 0;
				this.getPlayerMedicalTreatments(player.id).forEach(treatment => {
					if (moment(treatment.date).isBetween(moment(period[0]), moment(period[1]), 'days', '[]')) {
						counter += 1;
					}
				});
				counters = [...counters, counter];
			}
		});
		return [counters];
	}

	private daysAbsenceOccurrence(values, period) {
		let counters = [];
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				counters = [...counters, this.avg(player.players, this.daysAbsenceOccurrence, true, period)];
			} else {
				let games = 0;
				let trainings = 0;
				let others = 0;
				player.injuries.forEach(injury => {
					const diff = sortBy(injury._injuryAssessments, 'date').reduce(
						(acc, ass, i, arr) =>
							acc +
							(ass.available === 'no' &&
							(i === arr.length - 1 || moment(arr[i + 1].date).isSameOrAfter(moment(period[0]), 'day'))
								? getDiffDays(
										{ date: ass.date, endDate: arr[i + 1] ? arr[i + 1].date : injury.endDate || period[1] },
										period
									)
								: 0),
						0
					);
					if (
						injury.occurrence === 'medical.infirmary.details.occurrence.game1stQuarter' ||
						injury.occurrence === 'medical.infirmary.details.occurrence.game2ndQuarter' ||
						injury.occurrence === 'medical.infirmary.details.occurrence.game3rdQuarter' ||
						injury.occurrence === 'medical.infirmary.details.occurrence.game4thQuarter'
					) {
						games += diff;
					} else if (
						injury.occurrence === 'medical.infirmary.details.occurrence.fieldTraining' ||
						injury.occurrence === 'medical.infirmary.details.occurrence.fieldTrainingNonfootball' ||
						injury.occurrence === 'medical.infirmary.details.occurrence.gymSession'
					) {
						trainings += diff;
					} else {
						others += diff;
					}
				});
				counters = [...counters, [games, trainings, others]];
			}
		});
		return counters;
	}

	getEventMissedInjury(trainings, injuries, player) {
		let trainingMissed = 0;
		sortByDate(trainings, 'start').forEach(session => {
			const playerInj = injuries.filter(
				inj =>
					inj.playerId === player.id &&
					moment(session.start).isSameOrBefore(moment()) &&
					((inj.endDate && moment(session.start).isBetween(moment(inj.date), moment(inj.endDate), 'minute', '[]')) ||
						(!inj.endDate && moment(session.start).isSameOrAfter(moment(inj.date))))
			);
			const available = this.hasMissedAnyEvent(session.start, playerInj);
			if (available === false) trainingMissed += 1;
		});

		return trainingMissed;
	}

	hasMissedAnyEvent(date, injuries) {
		const statuses = injuries.map(x => this.getAssessmentStatusForDate(date, x));
		const available = statuses.map(x => this.getInjuryAvailability(x)).reduce((a, b) => a && b, true);

		return available;
	}

	getAssessmentStatusForDate(date, injury) {
		const assessments =
			injury._injuryAssessments && injury._injuryAssessments.length > 0
				? sortByDate(injury._injuryAssessments, 'date')
				: [];
		let status = 'yes';
		for (let index = 0; index < assessments.length; index++) {
			if (index === assessments.length - 1) {
				status = assessments[index].available;
				break;
			} else if (
				moment(date).isBetween(moment(assessments[index].date), moment(assessments[index + 1].date), 'day', '[]')
			) {
				status = assessments[index].available;
				break;
			}
		}
		return status;
	}

	getInjuryAvailability(status) {
		if (status === 'yes' || status === 'careful') return true;
		else return false;
	}

	// returns only an array composed of other 2 arrays corresponding to the labels in this.labels
	getDaysMissedInjury(values, games, trainings) {
		let gameMissed = [];
		let trainingMissed = [];
		values.forEach(player => {
			if (player.players && isGroup(player.players)) {
				let tempG = [];
				let tempS = [];
				player.players.forEach(id => {
					const tempPl = this.players.find(pl => pl.id === id);
					if (tempPl) {
						const teamSessions = trainings.filter(x => !x.individual);
						// const individualSessions = trainings.filter(x => x.individual === true && x.playerIds.includes(tempPl.id));
						tempG = [...tempG, this.getEventMissedInjury(games, tempPl.injuries, tempPl)];
						tempS = [...tempS, this.getEventMissedInjury(teamSessions, tempPl.injuries, tempPl)];
					}
				});
				gameMissed = [...gameMissed, tempG.reduce((a, b) => a + b, 0) / player.players.length];
				trainingMissed = [...trainingMissed, tempS.reduce((a, b) => a + b, 0) / player.players.length];
			} else {
				const teamSessions = trainings.filter(x => !x.individual);
				// const individualSessions = trainings.filter(x => x.individual === true && x.playerIds.includes(player.id));
				gameMissed = [...gameMissed, this.getEventMissedInjury(games, player.injuries, player)];
				trainingMissed = [...trainingMissed, this.getEventMissedInjury(teamSessions, player.injuries, player)];
			}
		});

		return [gameMissed, trainingMissed];
	}

	private getChartData(dataset, categories, metric) {
		const data = {
			labels: [],
			datasets: []
		};

		data.labels = this.chart === 'bar' ? categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x)) : categories;

		if (isNotEmpty(dataset)) {
			if (
				metric === 'medical.statistics.items.nInjuries' ||
				metric === 'medical.statistics.items.reInjuryRate' ||
				metric === 'medical.statistics.items.daysAbsenceOccurrence' ||
				metric === 'medical.statistics.items.daysPerStage' ||
				metric === 'medical.statistics.items.nLocation' ||
				metric === 'medical.statistics.items.nCategory' ||
				metric === 'medical.statistics.items.nMechanism' ||
				metric === 'medical.statistics.items.nOccurrence' ||
				metric === 'medical.statistics.items.nSeverity' ||
				metric === 'medical.statistics.items.nContact' ||
				metric === 'medical.statistics.items.nSystem' ||
				metric === 'medical.statistics.items.nType' ||
				metric === 'medical.statistics.items.treatmentsByLocation'
			)
				dataset = transpose(dataset);

			dataset.forEach((d, index) => {
				const bgColor: string = PRIMARIES[index] || chroma.random().hex();
				data.datasets.push({
					data: d.map((x: string) => Number(Math.round(Number(x + 'e3')) + 'e-3')),
					backgroundColor: this.chart === 'bar' ? bgColor : this.palette,
					borderColor: this.chart === 'bar' ? bgColor : this.chart === 'doughnut' ? this.paletteBorder : this.palette,
					borderWidth: 0,
					label: this.labels[index]
				});
			});
		}

		return data;
	}

	private getChartOptions(metric) {
		let options;
		if (this.chart === 'bar') options = { ...getDefaultCartesianConfig() };
		if (this.chart === 'doughnut') options = { ...getDefaultPieConfig() };

		if (
			metric === 'medical.statistics.items.nInjuries' ||
			metric === 'medical.statistics.items.reInjuryRate' ||
			metric === 'medical.statistics.items.daysAbsenceOccurrence' ||
			metric === 'medical.statistics.items.daysPerStage' ||
			metric === 'medical.statistics.items.daysMissedInjury' ||
			metric === 'medical.statistics.items.nLocation' ||
			metric === 'medical.statistics.items.nCategory' ||
			metric === 'medical.statistics.items.nMechanism' ||
			metric === 'medical.statistics.items.nOccurrence' ||
			metric === 'medical.statistics.items.nSeverity' ||
			metric === 'medical.statistics.items.nContact' ||
			metric === 'medical.statistics.items.nSystem' ||
			metric === 'medical.statistics.items.nType' ||
			metric === 'medical.statistics.items.treatmentsByLocation'
		) {
			options.scales.x.stacked = true;
			options.scales.y.stacked = true;
		}

		if (metric === 'medical.statistics.items.injuryRate') {
			options.scales.y.ticks.callback = value => value;
		}

		options.plugins.tooltip = {
			mode: this.chart === 'bar' ? 'index' : 'nearest',
			intersect: this.chart === 'bar' ? false : true
			// callbacks: {
			// 	title: (tooltipItem, data) => {
			// 		return tooltipItem[0].xLabel;
			// 	}
			// }
		};

		options.responsive = true;
		options.maintainAspectRatio = true;

		return options;
	}

	sortTranslate(res: any): Map<string, number> {
		const arr: any = Array.from(res.entries());
		arr.forEach(x => (x[0] = this.translate.instant(x[0])));
		return new Map(arr.sort());
	}

	onToggleLabels() {
		this.datalabels = !this.datalabels;
		const temp = copyValue(this.data);
		if (this.chart === 'bar') {
			this.data.datasets.forEach(x => {
				x.datalabels = getDataLabels(this.datalabels);
			});
			this.data = copyValue(temp);
		}
	}

	/**
	 * On click of Download csv option medical stats data for each player for selected time range of month will get downloaded in csv format.
	 *
	 * Medical Statistics calculate metrics for all the players in a defined time period range.
	 * Here in CSV download we don't want all the values for every day but the aggregated values per player per time range(the value of metrics for selected period)
	 *
	 * All the metrics are calculated in the UI.
	 * All the labels(in extractMetric()) should be added to the csv along with dynamic labels.
	 *
	 */
	downloadCsv() {
		const stats = [];

		// All the players without any groups included
		const values = this.players.filter((x: any) => !x.players || (x.players && !isGroup(x.players)));

		// 1) Metrics : "Days Missed Through Injury" = > Games missed through injury/Tarining missed through injury
		const datasetMissed = this.getDaysMissedInjury(values, this.games, this.trainings);

		// 2) Metrics: "Days Of Absence For Occurrence" => Days missed for games injuries/Days missed for trainings injuries/Days missed for others
		const datasetAbsOcc = this.daysAbsenceOccurrence(values, this.period);

		// 3) Metrics: "Days per stage" => Therapy/Rehab/Reconditioning/Return to Play/Return to Game
		const datasetDaysPerStage = this.daysPerStage(values, this.period);

		// 4) Metrics: "Injury Rate" => Injury rate
		const datasetInjRate = this.injuryRate(values, this.days, this.period);

		// 5) Metrics : "No of Injuries" = >  Injuries/Complaints/Illnesses
		const datasetInjuries = this.nInjuries(values);

		// 6) Metrics: "No of injuries by category"
		const datasetInjByCategory = this.extractInjuryByField(values, 'category');
		const catLabels = this.labels;

		// 7) Metrics: "No of injuries by contact"
		const datasetInjByContact = this.extractInjuryByField(values, 'contact');
		const contactLabels = this.labels;

		// 8) Metrics: "No of injuries by location"
		const datasetInjByLocation = this.extractInjuryByField(values, 'location');
		const locLabels = this.labels;

		// 9) Metrics: "No of injuries by mechanism"
		const datasetInjByMechanism = this.extractInjuryByField(values, 'mechanism');
		const mechanismLabels = this.labels;

		// 10) Metrics: "No of injuries by occurences"
		const datasetInjByOccurrences = this.extractInjuryByField(values, 'occurrence');
		const occurrencesLabels = this.labels;

		// 11) Metrics: "No of injuries by player position"  Chart type : doughnut
		let res = this.nPosition(values);
		res = this.sortTranslate(res);
		const datasetInjByPlayerPosition = [Array.from(res.values())];
		const playerPositionLabels = Array.from(res.keys());

		// 12) Metrics: "No of injuries by severity"
		const datasetInjBySeverity = this.extractInjuryByField(values, 'severity');
		const severityLabels = this.labels;

		// 13) Metrics: "No of injuries by system"
		const datasetInjBySystem = this.extractInjuryByField(values, 'system');
		const systemLabels = this.labels;

		// 14) Metrics: "No of injuries by type"
		const datasetInjByType = this.extractInjuryByField(values, 'type');
		const typeLabels = this.labels;

		// 15) Metrics : "No of re injury" => Re-injured/Not re-injured
		const datasetReinjury = this.reinjuryRate(values, this.period);

		// 16) Metrics: "No of treatments" => treatment
		const datasetTreatment = this.nTreatments(values, this.period);

		// 17) Metrics: "Treatment By Location"
		const datasetTreatmentByLocation = this.locationsForTreatments(values, this.period);
		const treatByLocLabels = this.labels;

		// Looping through each player record.
		values.forEach((player, index) => {
			const singleObj = {}; // temp object

			singleObj['Player Name'] = player['displayName'];

			// Metrics (Fixed labels): "Days missed through Injury"
			singleObj['Games Missed Through Injury'] = datasetMissed[0][index];
			singleObj['Training Missed Through Injury'] = datasetMissed[1][index];

			// Metrics (Fixed labels): "Days of absence for occurrence"
			singleObj['Days Missed For Games Injuries'] = datasetAbsOcc[index][0];
			singleObj['Days Missed For Training  Injuries'] = datasetAbsOcc[index][1];
			singleObj['Days Missed For Others'] = datasetAbsOcc[index][2];

			// Metrics (Fixed labels): "Days per stage"
			singleObj['Therapy'] = datasetDaysPerStage[index][0];
			singleObj['Rehab'] = datasetDaysPerStage[index][1];
			singleObj['Reconditioning'] = datasetDaysPerStage[index][2];
			singleObj['Return To Play'] = datasetDaysPerStage[index][3];
			singleObj['Return To Game'] = datasetDaysPerStage[index][4];

			// Metrics (Fixed labels): "Injury rate"
			singleObj['Injury Rate'] = Number(datasetInjRate[0][index].toFixed(1));

			// Metrics (Fixed labels): "No of injuries"
			singleObj['Injury'] = datasetInjuries[index][0];
			singleObj['Complaints'] = datasetInjuries[index][1];
			singleObj['Illness'] = datasetInjuries[index][2];

			// Metrics (dynamic labels): "No of injuries by category"
			catLabels.forEach((label, i) => {
				singleObj['No of injuries by category-' + label] = datasetInjByCategory[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by contact"
			contactLabels.forEach((label, i) => {
				singleObj['No of injuries by contact-' + label] = datasetInjByContact[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by location"
			locLabels.forEach((label, i) => {
				singleObj['No of injuries by location-' + label] = datasetInjByLocation[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by mechanism"
			mechanismLabels.forEach((label, i) => {
				singleObj['No of injuries by mechanism-' + label] = datasetInjByMechanism[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by occurrences"
			occurrencesLabels.forEach((label, i) => {
				singleObj['No of injuries by occurrences-' + label] = datasetInjByOccurrences[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by player position" Chart type : doughnut(Repeat for all players)
			playerPositionLabels.forEach((label, i) => {
				singleObj['No of injuries by player position-' + label] = datasetInjByPlayerPosition[0][i];
			});

			// Metrics (dynamic labels): "No of injuries by severity"
			severityLabels.forEach((label, i) => {
				singleObj['No of injuries by severity-' + label] = datasetInjBySeverity[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by system"
			systemLabels.forEach((label, i) => {
				singleObj['No of injuries by system-' + label] = datasetInjBySystem[index][i];
			});

			// Metrics (dynamic labels): "No of injuries by type"
			typeLabels.forEach((label, i) => {
				singleObj['No of injuries by type-' + label] = datasetInjByType[index][i];
			});

			// Metrics (Fixed labels): "No of re-injury"
			singleObj['Re-Injury'] = datasetReinjury[index][0];
			singleObj['Not Re-injury'] = datasetReinjury[index][1];

			// Metrics (Fixed labels): "No of treatments"
			singleObj['Treatment'] = datasetTreatment[0][index];

			// Metrics (dynamic labels): "Treatment By Location"
			treatByLocLabels.forEach((label, i) => {
				singleObj['Treatment By Location-' + label] = datasetTreatmentByLocation[index][i];
			});

			stats.push(singleObj); // Adding to final array of objects
		});

		const results = Papa.unparse(stats, {});
		const fileName =
			'MedicalStats_' +
			moment(this.period[0]).format('DD-MM-YYYY') +
			'_' +
			moment(this.period[1]).format('DD-MM-YYYY') +
			'.csv';

		// const contentDispositionHeader: string = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}
}
