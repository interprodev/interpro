import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormattedDate, Opponent, Player, VideoAsset } from '@iterpro/shared/data-access/sdk';
import { VideoService, sortByDateDesc, sortByName } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { ActiveFilterControls, FilterStatus } from '../models/video-gallery.model';

@Component({
	selector: 'iterpro-video-gallery-filter',
	templateUrl: './video-gallery-filter.component.html',
	styleUrls: ['./video-gallery-filter.component.css']
})
export class VideoGalleryFilterComponent implements OnInit {
	@Input({ required: true }) players: Player[];
	@Input({ required: true }) videos: VideoAsset[] = [];
	@Input({ required: true }) controls: ActiveFilterControls = {};
	@Input({ required: true }) status: FilterStatus = {
		text: '',
		home: true,
		away: true,
		tags: [],
		players: [],
		// staffs: [],
		opponents: [],
		dates: []
	};
	@Input() focus: boolean = true;
	@Output() filter: EventEmitter<FilterStatus> = new EventEmitter<FilterStatus>();

	tagOptions: SelectItem[] = []; // available tags
	playerOptions: SelectItem[] = []; // available players
	// staffFilters: SelectItem[] = []; // available staff
	opponentOptions: Opponent[] = []; // available opponents
	dateOptions: FormattedDate[] = []; // available dates
	searchText: string;

	// Services
	readonly #videoService = inject(VideoService);
	readonly #translateService = inject(TranslateService);

	ngOnInit() {
		const defaultActiveControls = {
			text: true,
			home: true,
			away: true,
			tags: true,
			players: true,
			// staffs: true,
			opponents: true,
			date: true
		};
		this.controls = { ...defaultActiveControls, ...this.controls };
		this.searchText = this.status.text;
		this.updateFilters(this.videos);
	}

	resetFilters() {
		this.searchText = '';
		this.status.text = '';
		this.status.home = true;
		this.status.away = true;
		this.status.tags = [];
		this.status.players = [];
		// this.status.staffs = [];
		this.status.opponents = [];
		this.status.dates = [];
		this.emitFilterValues();
	}

	filterHome(event: any) {
		this.status.home = event.checked;
		if (!this.status.away && !this.status.home) {
			this.status.away = true;
		}
		this.emitFilterValues();
	}
	filterAway(event: any) {
		this.status.away = event.checked;
		if (!this.status.away && !this.status.home) {
			this.status.home = true;
		}
		this.emitFilterValues();
	}

	// SEARCH
	onInput() {
		this.emitFilterValues();
	}

	emitFilterValues() {
		this.status.text = this.searchText;
		this.filter.emit(this.status);
	}

	private updateFilters(videos: VideoAsset[]) {
		this.opponentOptions = sortByName(this.#videoService.getUniqueOpponents(videos), 'opponent');
		this.dateOptions = sortByDateDesc(this.#videoService.getUniqueDates(videos), 'formattedDate');
		this.tagOptions = sortByName(this.#videoService.getUniqueTags(videos), 'value');
		this.playerOptions = sortByName(this.#videoService.getUniquePlayers(videos, this.players), 'value');
		// this.staffFilters = sortByName(this.#videoService.getUniqueStaffs(VideoAssets), 'value');
		const label: string = this.#translateService.instant('videogallery.novalue');
		this.tagOptions.unshift({ label, value: '' });
	}
}
