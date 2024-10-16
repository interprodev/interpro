import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ConstantService, EditModeService, sortByName } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { calcSleepDuration } from '../../utils/assessments.util';
import { Player } from '@iterpro/shared/data-access/sdk';

interface PlayerWellness {
	id: string;
	displayName: string;
	wellness_sleep: number;
	sleep_start: string;
	sleep_end: string;
	sleep_hours: string;
	wellness_mood: number;
	wellness_stress: number;
	wellness_soreness: number;
	locations: string[];
	wellness_fatigue: number;
	wellness_id: string;
}
@Component({
	selector: 'iterpro-wellness-teamview',
	templateUrl: './wellness-teamview.component.html',
	styleUrls: ['./wellness-teamview.component.css']
})
export class WellnessTeamviewComponent implements OnChanges {
	@Input() playersItem: Player[] = [];
	@Input() currentDate: Date;
	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() deleteEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() incompleteWellnessEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() csvUploadEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() csvDownloadEmitter: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('inputjson', { static: true }) myInput: ElementRef;
	players: PlayerWellness[];
	fileReader: FileReader;
	locationOptions: SelectItem<string>[] = [];

	constructor(
		public editService: EditModeService,
		private translateService: TranslateService,
		private preventionConstantService: ConstantService
	) {
		this.translateService.getTranslation(this.translateService.currentLang).subscribe(() => {
			this.translateService = translateService;
			this.getDropdownList();
		});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['playersItem'] && changes['playersItem'].currentValue) {
			this.players = this.playersItem.map(value => ({
				id: value?.id,
				displayName: value?.displayName,
				wellness_sleep: value?.wellnesses?.length > 0 ? value.wellnesses[0].wellness_sleep : null,
				sleep_start: value?.wellnesses?.length > 0 ? value.wellnesses[0].sleep_start : null,
				sleep_end: value?.wellnesses?.length > 0 ? value.wellnesses[0].sleep_end : null,
				sleep_hours:
					value?.wellnesses?.length > 0
						? calcSleepDuration(value.wellnesses[0].sleep_start, value.wellnesses[0].sleep_end)
						: null,
				wellness_mood: value?.wellnesses?.length > 0 ? value.wellnesses[0].wellness_mood : null,
				wellness_stress: value?.wellnesses?.length > 0 ? value.wellnesses[0].wellness_stress : null,
				wellness_soreness: value?.wellnesses?.length > 0 ? value.wellnesses[0].wellness_soreness : null,
				locations: value?.wellnesses?.length > 0 ? value.wellnesses[0].locations : null,
				wellness_fatigue: value?.wellnesses?.length > 0 ? value.wellnesses[0].wellness_fatigue : null,
				wellness_id: value?.wellnesses?.length > 0 ? value.wellnesses[0].id : null
			}));
		}
	}

	private getDropdownList() {
		const locations: SelectItem[] = this.preventionConstantService.getLocations();
		this.locationOptions = locations.map((location: SelectItem<string>) => ({
			label: this.translateService.instant(location.label),
			value: location.value.split('medical.infirmary.details.location.')[1] || location.value
		}));
		this.locationOptions = sortByName(this.locationOptions, 'label');
	}

	getColorScore(num) {
		if (!num) return 'transparent';
		if (num <= 2) return 'red';
		else if (num === 3) return 'yellow';
		else return 'green';
	}

	saveMultipleWellness() {
		// find only if there is a incomplete wellness (with at least one field filled, (with a particular check for wellness_soreness)
		const sorenessRequiredLocationThreshold = 2;
		const editedPlayers = this.players.filter(
			player =>
				player.wellness_sleep ||
				player.sleep_start ||
				player.sleep_end ||
				player.wellness_soreness ||
				player.wellness_fatigue ||
				player.wellness_mood ||
				player.wellness_stress ||
				(player.wellness_soreness && player.wellness_soreness <= sorenessRequiredLocationThreshold) ||
				player?.locations?.length > 0
		);
		const incompleteWellness = editedPlayers.filter(
			player =>
				!player.wellness_sleep ||
				!player.sleep_start ||
				!player.sleep_end ||
				!player.wellness_soreness ||
				!player.wellness_fatigue ||
				!player.wellness_mood ||
				!player.wellness_stress ||
				(player.wellness_soreness <= sorenessRequiredLocationThreshold && player?.locations?.length === 0)
		);
		if (incompleteWellness.length > 0) {
			this.incompleteWellnessEmitter.emit();
		} else {
			const playersToSave = editedPlayers.filter(
				player =>
					player.wellness_sleep &&
					player.sleep_start &&
					player.sleep_end &&
					player.wellness_soreness &&
					player.wellness_fatigue &&
					player.wellness_mood &&
					player.wellness_stress &&
					(player.wellness_soreness >= sorenessRequiredLocationThreshold || player?.locations?.length > 0)
			);
			if (playersToSave.length > 0) {
				this.saveEmitter.emit(playersToSave);
			}
		}
	}

	deleteMultipleWellness() {
		this.deleteEmitter.emit(this.players);
	}

	fileChanged(event) {
		this.fileReader = new FileReader();
		this.fileReader.onload = e => {
			const csvData = this.fileReader.result;
			const resultsCsv = Papa.parse(csvData.toString(), {
				header: true,
				skipEmptyLines: true
			});
			const plMap = this.playersItem
				.filter(({ displayName }) => displayName && (displayName !== '') != null)
				.reduce(
					(accumulator, target) => ({
						...accumulator,
						[target.displayName]: target.value
					}),
					{}
				);
			const csvMap = resultsCsv.data.reduce(
				(accumulator: any, target: any) => ({
					...accumulator,
					[target.displayName]: target
				}),
				{}
			);
			for (const player of this.players) {
				if (csvMap[player.displayName]) {
					player.wellness_fatigue = Number(csvMap[player.displayName].wellness_fatigue) || null;
					player.wellness_sleep = Number(csvMap[player.displayName].wellness_sleep) || null;
					player.sleep_start = csvMap[player.displayName].wellness_sleeptime || null;
					player.sleep_end = csvMap[player.displayName].wellness_wakeuptime || null;
					player.wellness_soreness = Number(csvMap[player.displayName].wellness_soreness) || null;

					if (player.wellness_soreness && player.wellness_soreness <= 2) {
						const locations = csvMap[player.displayName].wellness_sorenesslocation.split(',');
						player.locations = locations
							.filter(loc => loc || loc !== '')
							.map(location => this.locationOptions.find(option => option.label === location)?.value || location);
					}

					player.wellness_mood = Number(csvMap[player.displayName].wellness_mood) || null;
					player.wellness_stress = Number(csvMap[player.displayName].wellness_stress) || null;
					if (player.sleep_start && player.sleep_end) {
						player.sleep_hours = calcSleepDuration(player.sleep_start, player.sleep_end);
					}
				}
			}
			this.myInput.nativeElement.value = '';
			this.edit();
			this.csvUploadEmitter.emit();
		};

		this.fileReader.onerror = ev => {
			// eslint-disable-next-line no-console
			console.error(ev);
		};

		this.fileReader.readAsText(event.target.files[0]);
	}

	downloadCsv() {
		this.csvDownloadEmitter.emit();
	}

	edit(e?: any) {
		this.editService.editMode = true;
	}

	editSoreness(player: PlayerWellness) {
		if (player.wellness_soreness > 2) {
			player.locations = [];
		}
		this.editService.editMode = true;
	}

	onSleepStartChange(time: string, player: PlayerWellness) {
		player.sleep_start = time;
		this.onChangeSleepTime(player);
	}

	onSleepEndChange(time: string, player: PlayerWellness) {
		player.sleep_end = time;
		this.onChangeSleepTime(player);
	}

	private onChangeSleepTime(player: PlayerWellness) {
		player.sleep_hours = calcSleepDuration(player.sleep_start, player.sleep_end);
	}
}
