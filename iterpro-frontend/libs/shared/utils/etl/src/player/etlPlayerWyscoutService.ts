import { Injectable } from '@angular/core';
import { ThirdPartyEtlPlayerService } from '@iterpro/shared/data-access/sdk';
import { WithWyscoutFields } from '../mixins/wyscoutProviderField.mixin';
import { BaseEtlPlayerThirdPartyService } from './baseEtlPlayerThirdPartyService';

@Injectable({
	providedIn: 'root'
})
export class EtlPlayerWyscoutService
	extends WithWyscoutFields(BaseEtlPlayerThirdPartyService)
	implements ThirdPartyEtlPlayerService
{
	constructor() {
		super();
	}
}
