import { Injectable } from '@angular/core';
import { ThirdPartyEtlTeamService } from '@iterpro/shared/data-access/sdk';
import { WithInStatFields } from '../mixins/inStatProviderField.mixin';
import { BaseEtlTeamThirdPartyService } from './baseEtlTeamThirdPartyService';

@Injectable({
	providedIn: 'root'
})
export class EtlTeamInStatService
	extends WithInStatFields(BaseEtlTeamThirdPartyService)
	implements ThirdPartyEtlTeamService
{
	constructor() {
		super();
	}
}
