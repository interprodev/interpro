import { Injectable, inject } from '@angular/core';
import { Player, PlayerScouting, TableColumn } from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	getFlag,
	getMomentFormatFromStorage,
	isBase64Image
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

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
	readonly #translateService = inject(TranslateService);
	readonly #azurePipe = inject(AzureStoragePipe);

	getReport(
		players: { player: Player; associated: PlayerScouting[] }[],
		visibleColumns: string[],
		availableColumns: TableColumn[]
	) {
		const columnDescriptors = this.getColumnDescriptor(visibleColumns, availableColumns);
		const headers = this.getColumnHeaders(columnDescriptors);

		const rows: ScenarioPlayerReport[] = players.map(({ player, associated }) => this.getMappedScoutedPlayersSubReport(player, associated, columnDescriptors));

		return {
			headers,
			rows
		}
	}

	private getColumnDescriptor(visibleColumns: string[], availableColumns: TableColumn[]): TableColumn[] {
		const columns: string[] = this.getReportColumns(visibleColumns);
		const hasCustomColumnSelection = columns.length > 0;
		return availableColumns.filter(
			({ field }) => !hasCustomColumnSelection || columns.includes(field)
		);
	}

	private getColumnHeaders(columnDescriptors: TableColumn[]): HeaderCellReport[] {
		return columnDescriptors.map(({ field, header, alternativeHeader, align, type }) => {
			const headerToAdd = alternativeHeader ? alternativeHeader : header;
			return !!headerToAdd
				? { value: this.#translateService.instant(headerToAdd), class: !!align ? 'tw-text-' + align : 'tw-text-center', field }
				: { value: '', class: '', field };
		});
	}

	private getReportColumns(columns: string[]): string[] {
		const displayColumn = columns.includes('displayName') ? [] : ['displayName'];
		const pictureColumn = columns.includes('downloadUrl') ? [] : ['downloadUrl'];

		return [...pictureColumn, ...displayColumn, ...columns];
	}

	private getMappedScoutedPlayersSubReport(
		player: Player,
		associated: PlayerScouting[],
		columnDescriptors: TableColumn[]
	) {
		const scenarioPlayer = player.position;
		const scoutedPlayerSubReport: SubReport[][] = [];
		associated.forEach((scoutedPlayer, index) => {
			columnDescriptors.forEach(({ type, field, align }) => {
				if (!scoutedPlayerSubReport[index]) {
					scoutedPlayerSubReport[index] = [];
				}
				const reportCell = {
					value: field === 'position' ? scoutedPlayer.position : this.getExportedValue(type, scoutedPlayer[field]),
					type: type === 'flag' || type === 'image' ? type : 'text',
					class: !!align ? 'pt-' + align : 'tw-text-center'
				};
				scoutedPlayerSubReport[index].push(reportCell);
			});
		});
		return { scenarioPlayer, players: scoutedPlayerSubReport };
	}

	private getExportedValue(type: string, value: any): string {
		if (!!value) {
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
		return !!downloadUrl && isBase64Image(downloadUrl) ? downloadUrl : this.#azurePipe.transform(downloadUrl);
	}
}
