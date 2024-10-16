import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Goal, LoopBackAuth, MatchProviderStats, StatsResult } from '@iterpro/shared/data-access/sdk';
import { getScorers, getStats, toDisplayScorers } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { DatePipe, NgForOf, NgIf, NgStyle } from '@angular/common';
import { ArrayFromNumberPipe, CapitalizePipe } from '@iterpro/shared/ui/pipes';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
	standalone: true,
	selector: 'iterpro-match-details',
	templateUrl: './match-details.component.html',
	imports: [DatePipe, CapitalizePipe, NgStyle, TranslateModule, NgForOf, NgIf, SkeletonModule, ArrayFromNumberPipe],
	styleUrls: ['./match-details.component.css']
})
export class MatchDetailsComponent implements OnChanges {
	@Input() data: any;
	@Input({ required: true }) selected!: MatchProviderStats;
	@Input() style: any;
	@Input() isLoading!: boolean;

	stats: StatsResult[] = [];

	homeScore: string | number = '-';
	awayScore: string | number = '-';

	homeScorers: Goal[] = [];
	awayScorers: Goal[] = [];
	homeScorersDisplay: string[] = [];
	awayScorersDisplay: string[] = [];

	date!: Date;

	locale: string;

	constructor(
		private auth: LoopBackAuth,
		private translate: TranslateService
	) {
		this.locale = this.auth.getCurrentUserData().currentLanguage;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['data'] || changes['selected']) {
			if (this.selected && this.selected.home && this.selected.away && this.selected.match) {
				const t = this.translate.instant.bind(this.translate);
				this.date = moment(this.selected.match.dateutc).toDate();
				this.homeScore = moment().isBefore(moment(this.selected.match.dateutc), 'second')
					? '-'
					: this.selected.home.teamData.score;
				this.awayScore = moment().isBefore(moment(this.selected.match.dateutc), 'second')
					? '-'
					: this.selected.away.teamData.score;
				this.homeScorers = getScorers(this.selected.match, this.selected.home, false);
				this.homeScorers = [...this.homeScorers, ...getScorers(this.selected.match, this.selected.away, true)];
				this.homeScorersDisplay = toDisplayScorers(this.homeScorers, t).split(', ');
				this.awayScorers = getScorers(this.selected.match, this.selected.away, false);
				this.awayScorers = [...this.awayScorers, ...getScorers(this.selected.match, this.selected.home, true)];
				this.awayScorersDisplay = toDisplayScorers(this.awayScorers, t).split(', ');
			}
			this.updateStats();
		}
	}

	updateStats() {
		this.stats = getStats(this.selected);
	}
}
