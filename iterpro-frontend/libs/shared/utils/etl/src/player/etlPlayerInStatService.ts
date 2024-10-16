import { Injectable } from '@angular/core';
import { ThirdPartyEtlPlayerService } from '@iterpro/shared/data-access/sdk';
import { WithInStatFields } from '../mixins/inStatProviderField.mixin';
import { BaseEtlPlayerThirdPartyService } from './baseEtlPlayerThirdPartyService';

@Injectable({
	providedIn: 'root'
})
export class EtlPlayerInStatService
	extends WithInStatFields(BaseEtlPlayerThirdPartyService)
	implements ThirdPartyEtlPlayerService
{
	constructor() {
		super();
	}
}
