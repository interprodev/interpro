import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MixedType, ReadinessColumn, ReadinessPlayerData } from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	READINESS_TABLE_COLUMNS,
	ReadinessService,
	ReportService,
	compareValues,
	getFlag,
	getMomentFormatFromStorage,
	getPDFv2Path, isBase64Image
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { forkJoin } from 'rxjs';

@UntilDestroy()
@Component({
	selector: 'iterpro-readiness-table',
	templateUrl: './readiness-table.component.html',
	styleUrls: ['./readiness-table.component.scss']
})
export class ReadinessTableComponent implements OnInit, OnDestroy {
	@Input() list: ReadinessPlayerData[];
	@Input() isTableLoading = true;
	@Input() selectedDate: Date;

	@Output()
	playerClicked: EventEmitter<ReadinessPlayerData> = new EventEmitter<ReadinessPlayerData>();

	columns: ReadinessColumn[];

	constructor(
		private azurePipe: AzureStoragePipe,
		private translate: TranslateService,
		private reportService: ReportService,
		private readinessService: ReadinessService
	) {}

	ngOnDestroy() {
		console.debug('Readiness Table Destroy');
	}

	ngOnInit(): void {
		this.columns = READINESS_TABLE_COLUMNS.map(column => ({
			...column,
			header: column.header.length > 0 ? this.translate.instant(column.header) : column.header
		}));
		this.isTableLoading = false;
	}

	ngForTrackByFn(player: ReadinessPlayerData) {
		return player.id;
	}

	onRowClick(player: ReadinessPlayerData) {
		this.playerClicked.emit(player);
	}

	customSort(event) {
		event.data.sort((data1: ReadinessPlayerData, data2: ReadinessPlayerData) => {
			const value1 = data1[event.field];
			const value2 = data2[event.field];
			return event.order * compareValues(value1, value2);
		});
	}

	getWellnessSorenessLocations(locations: string[]): string {
		return (locations || []).map(loc => this.translate.instant('medical.infirmary.details.location.' + loc)).join(', ');
	}

	downloadPDF() {
		const report = {
			header: {
				title: this.translate.instant(`READINESS TEAM`).toUpperCase(),
				subTitle: 'LIST VIEW'
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			table: {
				headers: this.columns.map((column: ReadinessColumn) => {
					return {
						label: column.header ? this.translate.instant(column.header) : '',
						mode: column.type === 'jerseyNumber' ? 'fa-icon' : 'text',
						value: column.type === 'jerseyNumber' ? 'fas fa-tshirt' : undefined,
						alignment: column.align
					};
				}),
				rows: this.list.map((player: ReadinessPlayerData) => {
					return this.columns.map((column: ReadinessColumn) => {
						const item = this.getReportPlayerData(column, player);
						return {
							...item,
							alignment: column.align
						};
					});
				})
			}
		};

		const getImages = report.table.rows.map(row => this.reportService.getImages([<string>row[0].value]));

		forkJoin(getImages)
			.pipe(untilDestroyed(this))
			.subscribe(results => {
				report.table.rows.forEach((section, i) => {
					const images = results[i];
					images.forEach((pic, j) => {
						section[0].value = pic.toString();
					});
				});

				this.reportService.getReport(getPDFv2Path('readiness', 'readiness_list'), report);
			});
	}

	downloadCSV() {
		const csvRows = this.list.map((player: ReadinessPlayerData) => {
			const row = {
				'Display Name': player.displayName,
				'Jersey Number': player.jersey,
				'Birth Date': moment(player.birthDate).format(getMomentFormatFromStorage()),
				Nationality: player.nationality,
				Position: player.position,
				Type: this.readinessService.getDateFormat(player.date),
				'GO Score': player.goscore.today.value,
				Sleep: player.wellness?.sleep?.value,
				'Sleep Hours': player.wellness?.sleep_duration,
				Mood: player.wellness?.mood?.value,
				Stress: player.wellness?.stress?.value,
				Soreness: player.wellness?.soreness?.value,
				'Soreness Locations': player.wellness?.locations
					.map(location => this.translate.instant('medical.infirmary.details.location.' + location))
					.join(', '),
				Fatigue: player.wellness?.fatigue?.value
			};
			return row;
		});
		const results = Papa.unparse(csvRows, {});
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, `Readiness - Table View ${moment(this.selectedDate).format(getMomentFormatFromStorage())}.csv`);
	}

	private getReportPlayerData(column: ReadinessColumn, player: ReadinessPlayerData): MixedType {
		switch (column.type) {
			case 'image':
				return {
					mode: 'image',
					label: null,
					value: player[column.field]
				};
			case 'translate':
				return {
					mode: 'text',
					label: player[column.field] ? this.translate.instant(player[column.field]) : null
				};
			case 'date':
				return {
					mode: 'text',
					label: player[column.field] ? moment(player[column.field]).format(getMomentFormatFromStorage()) : null
				};
			case 'injuryStatus':
				return {
					mode: 'fa-icon',
					label: '',
					value: player.healthStatus?.injuryIcon
				};
			case 'goScore': {
				return {
					mode: 'pointType',
					label: player.goscore.today?.value,
					cssStyle: 'background: ' + player.goscore.today?.color
				};
			}
			case 'wellnessBase': {
				const field = player.wellness[column.field];
				return {
					mode: 'pointType',
					label: field?.value,
					cssStyle: 'background: ' + field?.color
				};
			}
			case 'sleepTime': {
				return {
					mode: 'text',
					label: player.wellness.sleep_duration
				};
			}
			case 'wellnessSorenessLocation': {
				const locations = this.getWellnessSorenessLocations(player.wellness.locations);
				return {
					mode: 'text',
					label: locations
				};
			}
			case 'flag':
				return <MixedType>{
					mode: 'flag',
					label: player[column.field],
					value: getFlag(player[column.field]),
					alignment: 'center'
				};
		}
		return { label: player[column.field], mode: 'text' };
	}
}
