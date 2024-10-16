import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface BonusTableColumn {
	field: string;
	header: string;
	sortable: boolean;
	width: number;
	property?: string;
}

@Injectable({
	providedIn: 'root'
})
export class FinanceTableColumnsService {
	constructor(private translate: TranslateService) {}

	getPersonColumns(toReceive: boolean, staff: boolean): BonusTableColumn[] {
		return [
			{
				field: 'sortIcon',
				header: '',
				sortable: false,
				width: 50
			},
			{
				field: 'displayName',
				header: staff ? 'Staff' : this.translate.instant('bonus.playerName'),
				sortable: true,
				width: 200
			},
			{
				field: 'contractType',
				header: this.translate.instant('profile.contract'),
				sortable: true,
				width: 150,
				property: 'contractType'
			},
			{
				field: 'personStatus',
				header: this.translate.instant('bonus.status'),
				sortable: true,
				width: 150,
				property: 'personStatus'
			},
			{
				field: 'club',
				header: this.translate.instant('admin.club'),
				sortable: true,
				width: 150
			},
			{
				field: 'type',
				header: this.translate.instant('bonus.bonus'),
				sortable: true,
				width: 150
			},
			{
				field: 'percentage',
				header: this.translate.instant('bonus.progress'),
				sortable: true,
				width: 150,
				property: 'perc'
			},
			{
				field: 'amount',
				header: this.translate.instant('bonus.amount'),
				sortable: true,
				width: 100
			},
			{
				field: 'dueDate',
				header: this.translate.instant('bonus.dueDate'),
				sortable: true,
				width: 100,
				property: 'due'
			},
			{
				field: 'reachable',
				header: this.translate.instant('bonus.reachable'),
				sortable: true,
				width: 120
			},
			{
				field: 'reached',
				header: this.translate.instant('bonus.reached'),
				sortable: true,
				width: 100
			},
			{
				field: 'achievedDate',
				header: this.translate.instant('bonus.achievedDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'confirmed',
				header: this.translate.instant('bonus.confirmed'),
				sortable: true,
				width: 120
			},
			{
				field: 'confirmedDate',
				header: this.translate.instant('bonus.confirmedDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'paid',
				header: toReceive ? this.translate.instant('bonus.received') : this.translate.instant('bonus.paid'),
				sortable: true,
				width: 100
			},
			{
				field: 'paidDate',
				header: toReceive ? this.translate.instant('bonus.receivedDate') : this.translate.instant('bonus.paidDate'),
				sortable: true,
				width: 150
			}
		];
	}

	getAgentCols(toReceive: boolean): BonusTableColumn[] {
		return [
			{
				field: 'sortIcon',
				header: '',
				sortable: false,
				width: 50
			},
			{
				field: 'displayName',
				header: this.translate.instant('bonus.agentName'),
				sortable: true,
				width: 200
			},
			{
				field: 'assisted',
				header: this.translate.instant('bonus.player'),
				sortable: true,
				width: 150
			},
			{
				field: 'contractType',
				header: this.translate.instant('profile.contract'),
				sortable: true,
				width: 150,
				property: 'contractType'
			},
			{
				field: 'personStatus',
				header: this.translate.instant('bonus.status'),
				sortable: true,
				width: 150,
				property: 'personStatus'
			},
			{
				field: 'club',
				header: this.translate.instant('admin.club'),
				sortable: true,
				width: 150
			},
			{
				field: 'type',
				header: this.translate.instant('bonus.bonus'),
				sortable: true,
				width: 150
			},
			{
				field: 'percentage',
				header: this.translate.instant('bonus.percentage'),
				sortable: true,
				width: 150
			},
			{
				field: 'amount',
				header: this.translate.instant('bonus.amount'),
				sortable: true,
				width: 100
			},
			{
				field: 'dueDate',
				header: this.translate.instant('bonus.dueDate'),
				sortable: true,
				width: 100
			},
			{
				field: 'reachable',
				header: this.translate.instant('bonus.reachable'),
				sortable: true,
				width: 120
			},
			{
				field: 'reached',
				header: this.translate.instant('bonus.reached'),
				sortable: true,
				width: 100
			},
			{
				field: 'achievedDate',
				header: this.translate.instant('bonus.achievedDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'confirmed',
				header: this.translate.instant('bonus.confirmed'),
				sortable: true,
				width: 120
			},
			{
				field: 'confirmedDate',
				header: this.translate.instant('bonus.confirmedDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'paid',
				header: toReceive ? this.translate.instant('bonus.received') : this.translate.instant('bonus.paid'),
				sortable: true,
				width: 100
			},
			{
				field: 'paidDate',
				header: toReceive ? this.translate.instant('bonus.receivedDate') : this.translate.instant('bonus.paidDate'),
				sortable: true,
				width: 150
			}
		];
	}

	getMatchCols(toReceive: boolean): BonusTableColumn[] {
		return [
			{
				field: 'sortIcon',
				header: '',
				sortable: false,
				width: 50
			},
			{
				field: 'amount',
				header: this.translate.instant('bonus.team.total'),
				sortable: true,
				width: 120
			},
			{
				field: 'people',
				header: this.translate.instant('bonus.team.people'),
				sortable: true,
				width: 150
			},
			{
				field: 'each',
				header: this.translate.instant('bonus.team.each'),
				sortable: true,
				width: 120
			},
			{
				field: 'dueDate',
				header: this.translate.instant('bonus.dueDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'reached',
				header: this.translate.instant('bonus.reached'),
				sortable: true,
				width: 120
			},
			{
				field: 'achievedDate',
				header: this.translate.instant('bonus.achievedDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'confirmed',
				header: this.translate.instant('bonus.confirmed'),
				sortable: true,
				width: 120
			},
			{
				field: 'confirmedDate',
				header: this.translate.instant('bonus.confirmedDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'paid',
				header: toReceive ? this.translate.instant('bonus.received') : this.translate.instant('bonus.paid'),
				sortable: true,
				width: 100
			},
			{
				field: 'paidDate',
				header: toReceive ? this.translate.instant('bonus.receivedDate') : this.translate.instant('bonus.paidDate'),
				sortable: true,
				width: 150
			},
			{
				field: 'actions',
				header: '',
				sortable: false,
				width: 100
			}
		];
	}
}
