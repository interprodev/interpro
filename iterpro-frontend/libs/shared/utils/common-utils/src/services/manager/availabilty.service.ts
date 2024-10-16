import { Injectable } from '@angular/core';
import { Availability, GOScore, Injury, Player } from '@iterpro/shared/data-access/sdk';
import { isArray, isMap } from 'lodash';
import * as moment from 'moment';
import { sortByDateDesc } from '../../utils/dates/date.util';

@Injectable({
	providedIn: 'root'
})
export class AvailabiltyService {
	getCurrentHealthstatusScore(player: Player) {
		const availability = this.getAvailability(
			(player.injuries as Injury[]).filter(
				({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed'
			),
			moment().toDate()
		);
		const goscores =
			player.goScores && player.goScores.length > 0
				? sortByDateDesc(
						Array.from(player.goScores.values()).filter(x => x),
						'date'
				  )
				: [];
		return this.getReadinessScore(availability.available === 'no' ? new GOScore({ score: 100 }) : goscores[0]);
	}

	getCurrentHealthStatusColor(player: Player): string {
		const availability = this.getAvailability(
			player.injuries.filter(({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed'),
			moment().toDate()
		);
		const goscores = isArray(player.goScores)
			? sortByDateDesc(
					Array.from(player.goScores.values()).filter(x => x),
					'date'
			  )
			: isMap(player.goScores)
			? Array.from(new Map(player.goScores as any).values()).filter(x => x)
			: [];
		return this.getReadinessColor(availability.available === 'no' ? new GOScore({ score: 0 }) : goscores[0]);
	}

	private getReadinessScore(goscore: GOScore): number {
		if (!goscore) return 0;
		else return goscore.score;
	}

	getReadinessColor(goscore: GOScore): string {
		if (!goscore) return 'lightgrey';
		else if (Number(goscore.score) < 60) return 'red';
		else if (Number(goscore.score) < 75) return 'yellow';
		else return 'green';
	}

	getAvailability(injuries: Injury[], period: Date): Availability {
		let availability: Availability = { available: 'yes' };
		injuries.forEach((injury: Injury) => {
			if (injury._injuryAssessments && injury._injuryAssessments.length > 0) {
				injury._injuryAssessments = sortByDateDesc(injury._injuryAssessments, 'date');
				const filteredAssessments = this.getPeriodAssessments(injury._injuryAssessments, period);
				if (
					availability.available !== 'no' &&
					filteredAssessments.length > 0 &&
					filteredAssessments[0].available !== 'yes' &&
					!moment().isSame(injury.endDate, 'day')
				) {
					availability = { ...filteredAssessments[0] };
				}
			}
		});
		return availability;
	}

	private getPeriodAssessments(assessments: any[], period?: Date) {
		return !period ? assessments : assessments.filter(({ date }) => moment(date).isSameOrBefore(moment(period)));
	}
}
