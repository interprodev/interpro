import { inject, Injectable } from '@angular/core';
import { Player, PlayerScouting, TableColumn } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { AzureStoragePipe } from '../../pipes/azure-storage.pipe';
import { getMomentFormatFromStorage } from '../../utils/dates/date-format.util';
import { getFlag } from '../../utils/translations/flag.util';
import { isBase64Image } from '@iterpro/shared/utils/common-utils';

interface SubReport {
	value: string;
	type: string;
	class: string;
}

interface HeaderCellReport {
	value: string;
	class: string;
	field: string;
}
interface ScenarioPlayerReport {
	scenarioPlayer: string;
	players: SubReport[][];
}

@Injectable({
	providedIn: 'root'
})
export class ScoutingFieldReportService {
	readonly PDF_MAX_COLUMNS_PER_PAGE = 9;
	readonly #translateService = inject(TranslateService);
	readonly #azurePipe = inject(AzureStoragePipe);

	getReport(
		players: { player: Player; associated: PlayerScouting[] }[],
		visibleColumns: string[],
		availableColumns: TableColumn[]
	) {
		const columnDescriptors = this.getColumnDescriptor(visibleColumns, availableColumns);
		const headers = this.getColumnHeaders(columnDescriptors);

		const rows: ScenarioPlayerReport[] = players.map(({ player, associated }) =>
			this.getMappedScoutedPlayersSubReport(player, associated, columnDescriptors)
		);

		return this.splitTableColumns(
			{
				headers,
				rows
			},
			this.PDF_MAX_COLUMNS_PER_PAGE
		);
	}

	private getColumnDescriptor(visibleColumns: string[], availableColumns: TableColumn[]): TableColumn[] {
		const columns: string[] = this.getReportColumns(visibleColumns);
		const hasCustomColumnSelection = columns.length > 0;
		const columnDescriptors = availableColumns.filter(
			({ field }) => !hasCustomColumnSelection || columns.includes(field)
		);
		return columnDescriptors;
	}

	private getColumnHeaders(columnDescriptors: TableColumn[]): HeaderCellReport[] {
		return columnDescriptors.map(({ field, header, alternativeHeader, align }) => {
			const headerToAdd = alternativeHeader ? alternativeHeader : header;
			return headerToAdd
				? { value: this.#translateService.instant(headerToAdd), class: align ? 'pt-' + align : 'tw-text-center', field }
				: { value: '', class: '', field };
		});
	}

	private getReportColumns(columns: string[]): string[] {
		const displayColumn = columns.includes('displayName') ? [] : ['displayName'];
		const pictureColumn = columns.includes('downloadUrl') ? [] : ['downloadUrl'];

		return [...pictureColumn, ...displayColumn, ...columns];
	}

	private splitTableColumns(
		{ headers, rows }: { headers: HeaderCellReport[]; rows: ScenarioPlayerReport[] },
		maxColumnPerPage: number
	) {
		const fixedColumnIndexes = this.findFieldIndexes(headers, ['downloadUrl', 'displayName']);
		const fixedHeaderColumns = fixedColumnIndexes.map(index => headers[index]);
		// remove fixed header because it will be added later for every table chunk
		const reportHeaders = headers.filter((header, index) => !fixedColumnIndexes.includes(index));

		// -1 because an index column is added in jsreport
		const columnsToAdd = maxColumnPerPage - fixedHeaderColumns.length - 1;

		const headerChunks: any[] = [];
		let chunkEndIndex = 0;
		for (let startIndex = 0; startIndex < reportHeaders.length; startIndex = chunkEndIndex) {
			chunkEndIndex = startIndex + columnsToAdd;
			const headerChunk = reportHeaders.slice(startIndex, chunkEndIndex);
			headerChunks.push({
				values: [...fixedHeaderColumns, ...headerChunk],
				startIndex,
				endIndex: reportHeaders.length < chunkEndIndex ? reportHeaders.length : chunkEndIndex
			});
		}

		const table = rows.map(({ scenarioPlayer, players }) => {
			const subTable: any[] = [];
			headerChunks.forEach(({ values, startIndex, endIndex }) => {
				const subRows: any[] = [];
				players.forEach((player: any[]) => {
					const fixedPlayerColumn = fixedColumnIndexes.map(index => player[index]);
					const playerToSplit = player.filter((playerField, index) => !fixedColumnIndexes.includes(index));

					const playerChunk = playerToSplit.slice(startIndex, endIndex);
					subRows.push([...fixedPlayerColumn, ...playerChunk]);
				});
				subTable.push({ headers: values, players: subRows });
			});

			return { scenarioPlayer, subTable };
		});

		return table;
	}

	private findFieldIndexes(headers: any[], fields: string[]): number[] {
		const indexes: number[] = [];
		fields.forEach(fieldToFind => {
			const index = headers.findIndex(({ field }) => field === fieldToFind);
			if (index > -1) {
				indexes.push(index);
			}
		});
		return indexes;
	}

	private getMappedScoutedPlayersSubReport(
		player: Player,
		associated: PlayerScouting[],
		columnDescriptors: TableColumn[]
	) {
		const scenarioPlayer = player.displayName + ' - ' + player.position;
		const scoutedPlayerSubReport: SubReport[][] = [];
		associated.forEach((scoutedPlayer, index) => {
			columnDescriptors.forEach(({ type, field, align }) => {
				if (!scoutedPlayerSubReport[index]) {
					scoutedPlayerSubReport[index] = [];
				}
				const reportCell = {
					value: this.getExportedValue(type as string, scoutedPlayer[field]),
					type: type === 'flag' || type === 'image' ? type : 'text',
					class: align ? 'pt-' + align : 'tw-text-center'
				};
				scoutedPlayerSubReport[index].push(reportCell);
			});
		});
		return { scenarioPlayer, players: scoutedPlayerSubReport };
	}

	private getExportedValue(type: string, value: any): string {
		if (value) {
			switch (type) {
				case 'image':
					return this.getProfileUrl({ downloadUrl: value });
				case 'translate':
					return this.#translateService.instant(value);
				case 'date':
					return moment(value).format(getMomentFormatFromStorage());
				case 'flag':
					return getFlag(value);
			}
		}
		return value;
	}

	private getProfileUrl({ downloadUrl }: { downloadUrl: string }): string {
		return !!downloadUrl && isBase64Image(downloadUrl)
			? downloadUrl
			: this.#azurePipe.transform(downloadUrl) || '';
	}
}
