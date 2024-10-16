import { FormControl } from '@angular/forms';
import { AttributeCategory } from '@iterpro/shared/data-access/sdk';

export interface DrillAttributeForm {
	value: FormControl<string>;
	label: FormControl<string>;
	category: FormControl<AttributeCategory>;
	description: FormControl<string>;
}

export interface DrillAttributeBlackList  {value: string, category: string}[];
