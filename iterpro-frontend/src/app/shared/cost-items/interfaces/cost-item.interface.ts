import { PdfBase, PdfBasicType, PdfMixedTable, PersonCostItem } from '@iterpro/shared/data-access/sdk';
import { SelectItem, SelectItemGroup } from 'primeng/api';

export declare type PersonCostItemType = 'Player' | 'Staff' | 'Agent';
export interface ExtendedPersonCostItem extends PersonCostItem {
	editMode?: boolean;
	fileRepositoryVisibility?: boolean;
	backup?: PersonCostItem;
}
export interface CostItemFilters {
	seasonIds: string[];
	teamIds: string[];
	types: string[];
	occurrencePeriod: Date[];
	personIds: string[];
	archivedPersons: boolean;
}

export interface CostItemPDFReport extends PdfBase {
	summary: CostItemSummary;
	table: PdfMixedTable;
}

export interface CostItemSummary {
	costsLabel: string;
	subscriptionsLabel: string;
	costNotePending: PdfBasicType;
	costNotePaid: PdfBasicType;
	costNoteOutstanding: PdfBasicType;
	subscriptionPending: PdfBasicType;
	subscriptionPaid: PdfBasicType;
	subscriptionOutstanding: PdfBasicType;
}

export interface DataToReportInput {
	t: any;
	items: PersonCostItem[];
	clubSeasonOptions: SelectItem[];
	typeOptions: SelectItem[];
	currency: string;
	personOptions?: SelectItemGroup[];
	personId?: string;
	singlePersonLabel: string;
}

export interface CostItemSearchPerson {
	displayName: string;
	id: string;
	teamId: string;
	downloadUrl: string;
	archived: boolean;
}
