import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ConstantService, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(momentLib);

@Component({
	selector: 'iterpro-session-summary',
	templateUrl: './session-summary.component.html',
	styleUrls: ['./session-summary.component.css']
})
export class SessionSummaryComponent implements OnChanges {
	@Input() session: any;
	@Input() sessionPlayers: any[];
	@Input() players: any[];

	drills: any[];
	light: any[] = [];
	medium: any[] = [];
	high: any[] = [];
	veryHigh: any[] = [];
	maximum: any[] = [];
	supramaximal: any[] = [];

	readonly #constantService = inject(ConstantService);
	readonly #translateService = inject(TranslateService);

	ngOnChanges(changes: SimpleChanges) {
		if (
			(changes['session'] || changes['players'] || changes['sessionPlayers']) &&
			this.session &&
			this.sessionPlayers
		) {
			this.scaffoldPlayers();
		}
	}

	getWorkload() {
		if (this.session && this.session.workload) {
			const effort = this.#constantService.effortList.find(({ value }) => value === this.session.workload);
			if (effort) return this.#translateService.instant(effort.label);
		}
		return null;
	}

	getDuration(num): string {
		const duration = moment.duration(Math.round(num), 'minutes');
		return `${duration.hours()}:${duration.minutes()}`;
	}

	scaffoldPlayers() {
		this.light = [];
		this.medium = [];
		this.high = [];
		this.veryHigh = [];
		this.maximum = [];
		this.supramaximal = [];

		const filtered = this.sessionPlayers.filter(({ mainSession }) => mainSession);
		filtered.forEach(playerSession => {
			const player = (this.players || []).find(({ id }) => String(id) === String(playerSession.playerId));
			if (player) playerSession.playerName = player.displayName;
			if (playerSession.workload <= 1) this.light = [...this.light, playerSession];
			else if (playerSession.workload <= 2) this.medium = [...this.medium, playerSession];
			else if (playerSession.workload <= 3) this.high = [...this.high, playerSession];
			else if (playerSession.workload <= 4) this.veryHigh = [...this.veryHigh, playerSession];
			else if (playerSession.workload <= 5) this.maximum = [...this.maximum, playerSession];
			else if (playerSession.workload > 5) this.supramaximal = [...this.supramaximal, playerSession];
		});
	}

	isTarget(numb, session) {
		return numb === session.workload;
	}

	getPercentTarget(players) {
		const len = this.sessionPlayers.filter(({ mainSession }) => mainSession).length;
		if (len > 0) {
			return players.length / len;
		}
	}

	getReport() {
		const t = this.#translateService.instant.bind(this.#translateService);
		const cols = [
			{ key: 'light', color: 'lightgray', index: 1 },
			{ key: 'medium', color: 'lightblue', index: 2 },
			{ key: 'high', color: 'yellow', index: 3 },
			{ key: 'veryHigh', color: 'orange', index: 4 },
			{ key: 'maximum', color: 'crimson', index: 5 },
			{ key: 'supramaximal', color: 'darkred', index: 6 }
		];
		const data = {
			overview: {
				title: t('workload.overview'),
				date: {
					label: t('general.date'),
					value: moment(this.session.start).format(`dddd ${getMomentFormatFromStorage()}`)
				},
				type: {
					label: t('event.type'),
					value: this.session.type
				},
				duration: {
					label: t('event.duration'),
					value: this.getDuration(this.session.duration)
				},
				theme: {
					label: t('event.theme'),
					value: this.session.theme ? t(this.session.theme) : ''
				},
				subtheme:
					this.session.theme === 'field'
						? {
								label: t('event.subtheme'),
								value: this.session.subtheme ? t(this.session.subtheme) : ''
						  }
						: null,
				workload: {
					label: t('event.workload'),
					value: this.getWorkload()
				}
			},
			drills: this.session._drillsExecuted.map((drill, i) => [
				i + 1,
				drill.name,
				drill.sets,
				drill.reps,
				drill.count,
				drill.rest,
				this.getDuration(drill.duration)
			]),
			outcome: {
				title: t('workload.outcome'),
				cols: cols.map(col => ({
					title: t(`event.effort.${col.index}`),
					target: this.session && this.isTarget(col.index, this.session),
					percent: this.sessionPlayers && Math.round(this.getPercentTarget(this[col.key]) * 100),
					players: this[col.key].map(({ playerName }) => playerName),
					color: col.color
				}))
			}
		};
		return data;
	}
}
