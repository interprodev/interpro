import { Injectable, inject } from '@angular/core';
import { GOScore, MedicalPreventionPlayer, Player } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { getMomentFormatFromStorage } from '../../utils/dates/date-format.util';
import { CalendarService } from '../calendar.service';

// TODO: check each function if it's still used. Convert all the real-time client-based logic and use the backend logic
@Injectable({
	providedIn: 'root'
})
export class ReadinessService {
	readonly #calendarService = inject(CalendarService);

	getProfilePic(player: Player) {
		return player.downloadUrl;
	}

	filterGoScoresByDate({ goScoresMap }: Partial<MedicalPreventionPlayer | any>, dates: moment.Moment[]) {
		const filteredMap: Map<string, GOScore> = new Map<string, GOScore>();
		let key: string;
		dates.forEach(date => {
			key = date.format(getMomentFormatFromStorage());
			if (goScoresMap.has(key)) {
				filteredMap.set(key, goScoresMap.get(key));
			}
		});
		return filteredMap;
	}

	extractGoIncrement(
		{ goScoresMap }: MedicalPreventionPlayer | any,
		goScore: GOScore,
		dayBefore: string,
		dayBeforeDay: string
	) {
		if (!goScore) return '-';
		let signScore;
		let diff;
		const prevsGo = [goScoresMap.get(dayBefore), goScoresMap.get(dayBeforeDay)];
		if (prevsGo[0]) {
			signScore = (goScore.score - prevsGo[0].score) / goScore.score >= 0 ? '+' : '';
			diff = Number(goScore.score - prevsGo[0].score).toFixed(0);
			return signScore + diff + '%';
		} else if (prevsGo[1]) {
			signScore = (goScore.score - prevsGo[1].score) / goScore.score >= 0 ? '+' : '';
			diff = Number(goScore.score - prevsGo[1].score).toFixed(0);
			return signScore + diff + '%';
		} else {
			return '-';
		}
	}

	extractMeans(scores: Map<string, GOScore>): number {
		let sum = 0;
		scores.forEach(goScore => {
			if (goScore) {
				sum += goScore.score;
			}
		});
		const avg = scores.size > 0 ? Math.round(sum / scores.size) : undefined;
		return avg || 0;
	}

	getDateFormat(date: Date) {
		return this.#calendarService.getGD(date);
	}
}
