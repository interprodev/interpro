import { Pipe, PipeTransform } from '@angular/core';
import { AtcItem } from '@iterpro/shared/data-access/sdk';
import { convertToString } from '@iterpro/shared/utils/common-utils';
import { SelectItem } from 'primeng/api';

@Pipe({
	name: 'toSelectItem'
})
export class ToSelectItemPipe implements PipeTransform {
	admMappings: Map<string, string> = new Map<string, string>();

	constructor() {
		this.admMappings.set('Implant', 'implant');
		this.admMappings.set('Inhal', 'inhalation');
		this.admMappings.set('Instill', 'instillation');
		this.admMappings.set('N', 'nasal');
		this.admMappings.set('O', 'oral');
		this.admMappings.set('P', 'parenteral');
		this.admMappings.set('R', 'rectal');
		this.admMappings.set('SL', 'sublingual/buccal/oromucosal');
		this.admMappings.set('TD', 'transdermal');
		this.admMappings.set('V', 'vaginal');
		this.admMappings.set('', '');
	}

	public transform(objects: AtcItem[]): SelectItem[] {
		if (!objects) return undefined;
		return objects.map(drug =>
			Object.assign({}, drug, {
				label: `${convertToString(drug['name'])} ${convertToString(drug['DDD'])} ${convertToString(
					drug['Unit']
				)} ${convertToString(this.admMappings.get(drug.AdmR))}`,
				value: drug
			})
		);
	}
}
