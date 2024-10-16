import { Component, OnInit } from '@angular/core';
import { LoopBackAuth } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-finance-cost-items',
	templateUrl: './finance-cost-items.component.html',
	styleUrls: ['./finance-cost-items.component.scss']
})
export class FinanceCostItemsComponent implements OnInit {
	viewType: ViewType = ViewType.CostNote;
	viewTypes = ViewType;
	clubId: string;
	constructor(private auth: LoopBackAuth) {}

	ngOnInit(): void {
		this.clubId = this.auth.getCurrentUserData().clubId;
	}

	onTabChange(event) {
		this.viewType = event.index;
	}
}

enum ViewType {
	CostNote = 0
}
