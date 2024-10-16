import {
	Event,
	IBaseEtlPlayerService,
	Injury,
	Player,
	PlayerMatchStat,
	PlayerStat,
	SessionPlayerData
} from '@iterpro/shared/data-access/sdk';
import { isNotEmpty } from '@iterpro/shared/utils/common-utils';
import { uniq } from 'lodash';
import * as moment from 'moment';
import {
	AttendancesDay,
	AttendancesItem,
	AttendancesStore
} from 'src/app/+state/attendances-store/ngrx/attendances-store.model';
import { v4 as uuid } from 'uuid';
import {
	createGymTooltip,
	createTrainingTooltip,
	getClubGameSessionAttrs,
	getEventAttrs,
	getFriendlyAttr,
	getGameAttrs,
	getGymSessionAttrs,
	getInjuryAttrsByStatus,
	getNullAttrs,
	getTodayAttrs,
	getTrainingSessionAttrs
} from './attrs';
import { getDaysNumbers } from './date';

export default class AttendancesManager {
	private from: Date;
	private to: Date;
	private attendances: AttendancesStore[];

	constructor(from: Date, to: Date, players: Player[], private etlPlayerStats: IBaseEtlPlayerService) {
		this.from = from;
		this.to = to;
		const days = getDaysNumbers(from, to);

		this.setup(players, days);
	}

	getAttendances() {
		return this.attendances;
	}

	addEvents(events: Event[]) {
		events.forEach(event => {
			const eventStart = new Date(event.start);
			const eventEnd = new Date(event.end);
			const dateStart = eventStart < this.from ? this.from : eventStart;
			const dateEnd = eventEnd > this.to ? this.to : eventEnd;
			const eventDays = getDaysNumbers(dateStart, dateEnd);
			const playerIds = event.playerIds ? (uniq(event.playerIds) as string[]) : [];
			eventDays.forEach(day => {
				playerIds.forEach(playerId => {
					if (event.format === 'game' && event.match) {
						this.addGameAttendance(playerId, day, event);
					} else if (event.format === 'clubGame') {
						this.addClubGameAttendance(playerId, day, event);
					} else if (event.format === 'training' && event._sessionImport) {
						this.addSessionAttendance(playerId, day, event);
					} else {
						this.addAttendance(playerId, day, event, getEventAttrs(event));
					}
				});
			});
		});
	}

	addInjuries(injuries: Injury[]) {
		injuries.forEach(injuryItem => {
			const injury = { ...injuryItem }; // avoid readonly problems
			if (injury.player && injury.player.archived === true && !injury.endDate) {
				injury.endDate = injury.player.archivedDate;
			}

			if (!injury.endDate || (injury.endDate && moment(injury.endDate).isAfter(this.from))) {
				let diff: number;

				// extract phases for every injury day
				const daysBetweenChanges = [];
				let phases = [];

				injury.statusHistory.forEach((day, index) => {
					let next = injury.statusHistory[index + 1];
					if (!next)
						next = {
							date: moment().add(1, 'day').toDate()
						};
					daysBetweenChanges.push(moment(next.date).endOf('day').diff(moment(day.date).startOf('day'), 'day'));
				});

				daysBetweenChanges.forEach((period, index) => {
					for (let i = 0; i < period; i++) {
						phases.push(injury.statusHistory[index].phase);
					}
				});

				if (moment(injury.date).isBefore(this.from)) {
					// if injury.startDate is before this.from, splice phases from injury.startDate to this.from
					diff = moment(this.from).endOf('day').diff(moment(injury.date).startOf('day'), 'day');
					phases = phases.splice(diff, phases.length);
				}
				if (moment(injury.date).isAfter(this.from)) {
					// if injury.startDate is After this.from, add null elements till injury.startDate
					diff = moment(injury.date).diff(moment(this.from), 'day') - 1;
					for (let i = 0; i <= diff; i++) {
						phases.unshift(null);
					}
				}

				if (injury.endDate) {
					if (moment(injury.endDate).isBefore(moment(this.to))) {
						diff = moment(this.to).diff(moment(this.from), 'day');
						const diffFromStart = moment(injury.endDate).diff(this.from, 'day');
						for (let i = diffFromStart; i <= diff; i++) {
							phases[i] = null;
						}
					} else {
						injury.endDate = this.to;
					}
				}

				const injuryDays = getDaysNumbers(this.from, this.to);
				injuryDays.forEach(day => {
					if (phases[day]) {
						this.addAttendance(
							injury.player ? injury.player.id : null,
							day,
							injury,
							getInjuryAttrsByStatus(phases[day])
						);
					}
				});
			}
		});
	}

	private setup(players: Player[], days: number[]) {
		this.attendances = players.map(player => ({
			id: uuid(),
			player,
			days: days.map(day =>
				day === moment().date() - 1 &&
				moment(this.from).get('month') === moment().get('month') &&
				moment(this.from).get('year') === moment().get('year')
					? {
							items: [],
							current: getTodayAttrs()
					  }
					: {
							items: [],
							current: getNullAttrs(day)
					  }
			)
		}));
	}

	private getAttendance(player: any, day: number): AttendancesDay {
		const playerAttendance = this.attendances.find(a => a.player === player || a.player.id === player);
		return playerAttendance ? playerAttendance.days.find(dayData => dayData.current.day === day) : null;
	}

	private addAttendance(player: string, day: number, attendance: any, attrs: AttendancesItem) {
		const playerAttendanceDay = this.getAttendance(player, day);
		if (playerAttendanceDay) {
			const oldCurrent = playerAttendanceDay.current;
			const item: AttendancesItem = {
				attendance,
				...attrs,
				day
			};
			playerAttendanceDay.items.push(item);
			if (playerAttendanceDay.current.priority < attrs.priority) {
				playerAttendanceDay.current = item;
			}
			if (attrs.type === 'game') {
				playerAttendanceDay.minutes = attrs.minutes;
				if (playerAttendanceDay.current.type === 'injury') {
					playerAttendanceDay.current.text = playerAttendanceDay.minutes + '';
				}
			}
			if (oldCurrent.type === item.type && !!item.minutes) {
				playerAttendanceDay.current.text =
					'' + ((oldCurrent.text ? Number(oldCurrent.text) : 0) + Number(item.minutes));
			}
		}
	}

	private addGameAttendance(player: any, day: number, event: Event) {
		const duration: number = this.getDuration(event, player);

		let attrs: AttendancesItem;
		if (event.format === 'game') {
			attrs = getGameAttrs(event, duration);
		}
		if (event.subformat === 'friendly') {
			attrs = getFriendlyAttr(duration);
		}

		const playerAttendanceDay = this.getAttendance(player, day);
		if (!isNaN(duration) && playerAttendanceDay) {
			const oldCurrent = playerAttendanceDay.current;
			const item: AttendancesItem = {
				event,
				...attrs,
				day: oldCurrent.day
			};
			playerAttendanceDay.items.push(item);
			if (playerAttendanceDay.current.priority < attrs.priority) {
				playerAttendanceDay.current = item;
			} else if (oldCurrent.type === item.type) {
				playerAttendanceDay.current.text =
					'' + ((oldCurrent.text ? Number(oldCurrent.text) : 0) + Number(item.minutes));
			}
		}
	}
	private addClubGameAttendance(player: any, day: number, event: Event) {
		const duration: number = this.getDuration(event, player);

		const attrs: AttendancesItem = getClubGameSessionAttrs(event, duration);
		const playerAttendanceDay = this.getAttendance(player, day);
		if (!isNaN(duration) && !!playerAttendanceDay) {
			const oldCurrent = playerAttendanceDay.current;
			const item: AttendancesItem = {
				event: { ...event, subformat: event.subformat === 'friendly' ? 'Club friendly' : event.subformat },
				...attrs,
				day: oldCurrent.day
			};
			playerAttendanceDay.items.push(item);
			if (playerAttendanceDay.current.priority < attrs.priority) {
				playerAttendanceDay.current = item;
			} else if (oldCurrent.type === item.type) {
				playerAttendanceDay.current.text =
					'' + ((oldCurrent.text ? Number(oldCurrent.text) : 0) + Number(item.minutes));
			}
		}
	}

	private getDuration(event: Event, player: any) {
		let duration: number;
		if (event) {
			if (isNotEmpty(event._playerMatchStats)) {
				const stat: PlayerMatchStat = event._playerMatchStats.find(x => x.playerId === player);
				if (stat) {
					duration = Number(stat.minutesPlayed);
				}
			} else if (!!event.match && isNotEmpty(event.match._playerStats)) {
				const stat: PlayerStat = event.match._playerStats.find(x => x.playerId === player);
				if (stat) {
					const fieldVal =
						this.etlPlayerStats.getDurationField().metricName in stat
							? stat[this.etlPlayerStats.getDurationField().metricName]
							: null;
					duration = Number(fieldVal);
				}
			} else if (isNotEmpty(event._sessionPlayers)) {
				const sess: SessionPlayerData = event._sessionPlayers.find(x => x.playerId === player && x.mainSession);
				if (sess) {
					duration = sess.duration;
				}
			}
		}
		return duration;
	}

	/**
	 * @param player
	 * @param day
	 * @param event
	 */
	private addSessionAttendance(player: string, day: number, event: Event) {
		if (isNotEmpty(event._sessionPlayers)) {
			// event._sessionPlayers contains the playerSession.
			const sessionPl: SessionPlayerData = event._sessionPlayers.find(x => x.playerId === player);
			const playerAttendanceDay = this.getAttendance(player, day);

			// we should not have an event with the 'player tagged' but 'without session'.
			if (playerAttendanceDay && sessionPl) {
				const oldCurrent = playerAttendanceDay.current;
				let item = playerAttendanceDay.items.find(a => a.type === 'sessions');

				const sessionWithStartDate = {
					start: event.start,
					theme: event.theme,
					individual: event.individual,
					...sessionPl
				};

				if (!item) {
					item = {
						attendance: [sessionPl],
						...(event.theme === 'gym'
							? getGymSessionAttrs(sessionWithStartDate)
							: getTrainingSessionAttrs(sessionWithStartDate)),
						day: oldCurrent.day
					};
					playerAttendanceDay.items.push(item);
				} else {
					item.attendance.push(sessionWithStartDate);
				}

				/**
				 * Double stars as the legend says is related to "double sessions".
				 * If in the same day, the team has done 2 event training
				 * (example : morning/afternoon in the same day).
				 * we dont need priority for double session.
				 */
				if (item.attendance.length > 1) {
					item.text = '∗∗'; // Using '∗' star  instead of '*'
					item.tooltip = item.attendance
						.map(session =>
							session.theme && session.theme === 'gym' ? createGymTooltip(session) : createTrainingTooltip(session)
						)
						.join('\n• ');
				}

				if (!playerAttendanceDay.current || playerAttendanceDay.current.priority < item.priority) {
					playerAttendanceDay.current = item;
				} else if (oldCurrent.type === item.type && item.attendance.length <= 1) {
					playerAttendanceDay.current.text =
						'' + ((oldCurrent.text ? Number(oldCurrent.text) : 0) + Number(item.minutes));
				}
			}
		}
	}
}
