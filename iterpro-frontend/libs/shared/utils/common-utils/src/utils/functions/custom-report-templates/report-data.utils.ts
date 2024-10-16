import { PropertySchema, ReportDataAvg, ReportDataColumn } from '@iterpro/shared/data-access/sdk';
import { getCorrectTextColorUtil } from '@iterpro/shared/utils/common-utils';

export function getStyleFromReportRowType(
	type: string,
	itemValue: number | string | boolean,
	itemColor: string
): string {
	if (type === 'booleanType') {
		return `color: ${getIconColorForBooleanType(itemValue as boolean)}; text-align: center`;
	}
	if (type === 'pointType') {
		return `background: ${itemColor}`;
	}
	if (type === 'colorType') {
		return `background: ${itemColor}; color: ${getCorrectTextColorUtil(itemColor as string)}`;
	}
	return `color: ${itemColor}; text-align: center`;
}

export function getIconForBooleanType(avg: boolean): string {
	switch (avg) {
		case true:
			return 'fas fa-check';
		case false:
			return 'fas fa-times';
		default:
			return 'fas fa-circle-o';
	}
}

export function getIconColorForBooleanType(avg: boolean): string {
	switch (avg) {
		case true:
			return 'green';
		case false:
			return 'red';
		default:
			return 'orange';
	}
}

export function getModeFromReportRowType(type: string): 'text' | 'div' | 'fa-icon' | 'textarea' | 'pointType' {
	if (type === 'booleanType') {
		return 'fa-icon';
	}
	if (type === 'pointType') {
		return 'pointType';
	}
	return 'text';
}

export function convertPropertyTypeToMode(templateProperty: PropertySchema): 'pointType' | 'colorType' | 'booleanType' {
	if (templateProperty?.type === 'Function') {
		if (templateProperty?.operation?.name === 'sum') {
			return 'pointType';
		}
		return 'colorType';
	}
	if (templateProperty?.type === 'boolean') return 'booleanType';
	return 'pointType';
}

export function getModeFromProperty(
	templateProperty: PropertySchema
): 'text' | 'div' | 'fa-icon' | 'textarea' | 'pointType' {
	const result = convertPropertyTypeToMode(templateProperty);
	return getModeFromReportRowType(result);
}

export function getUniqueReportDataColumns(reportData: any): ReportDataColumn[] {
	const reportDatas = reportData.filter(item => item);
	const reportDataColumns: ReportDataColumn[] = [];
	const alreadyPushedColumns: string[] = [];
	for (const sectionData of reportDatas) {
		Object.keys(sectionData).forEach(key => {
			const reportProperties = sectionData[key];
			if (reportProperties && reportProperties.length > 0) {
				for (const property of reportProperties) {
					const columnKey = key + property.key;
					if (!alreadyPushedColumns.includes(columnKey)) {
						reportDataColumns.push({ key: key + property.key, label: property.label, type: property?.type });
						alreadyPushedColumns.push(columnKey);
					}
				}
			}
		});
	}
	return reportDataColumns;
}

export function getUniqueReportDataArrayColumns(reportData: any): ReportDataAvg[] {
	const playerReportData = reportData.filter(item => item);
	const reportDataColumns: ReportDataAvg[] = [];
	const alreadyPushedColumns: string[] = [];
	for (const row of playerReportData) {
		Object.keys(row).forEach(key => {
			const property: ReportDataAvg = row[key];
			const columnKey = property.sectionId + property.key;
			if (!alreadyPushedColumns.includes(columnKey)) {
				reportDataColumns.push({ key: columnKey, label: property.label, tooltip: property.tooltip });
				alreadyPushedColumns.push(columnKey);
			}
		});
	}
	return reportDataColumns;
}
