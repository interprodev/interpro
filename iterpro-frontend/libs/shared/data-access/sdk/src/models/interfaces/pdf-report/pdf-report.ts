import { ChartOptionsWithLabels } from '../chart/chart.interface';

export interface CommonListViewPDF extends PdfBase {
	table: PdfMixedTable;
}

export interface PdfMixedTable {
	headers: MixedType[];
	rows: MixedType[][];
	rowsDetail?: MixedType[][];
}

export interface CommonListViewPDF extends PdfBase {
	table: PdfMixedTable;
}

type PDFMixedMode =
	| 'text'
	| 'div'
	| 'fa-icon'
	| 'textarea'
	| 'pointType'
	| 'image'
	| 'flag'
	| 'progressbar'
	| 'markdown';
export interface MixedType {
	label?: string | number; // use it for text, numbers
	mode: PDFMixedMode;
	value?: string | number;
	cssClass?: string; // Item of cell cssClass
	cssStyle?: string; // Item of cell cssStyle
	alignment?: 'center' | 'left' | 'right'; // Cell Alignment
}

export interface PdfBasicType {
	label: string;
	value: string | number;
}

export function toJoinedString(items: string[]): string {
	return (items || []).map(item => String(item)).join(', ');
}

export interface PdfBase {
	header: {
		title: string;
		subTitle: string;
	};
	metadata: {
		createdLabel: string;
	};
}

export interface PdfChart {
	data: any;
	bubble?: boolean;
	options: ChartOptionsWithLabels;
}
