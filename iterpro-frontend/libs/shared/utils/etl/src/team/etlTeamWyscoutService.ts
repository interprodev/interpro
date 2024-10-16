import { Injectable } from '@angular/core';
import { ThirdPartyEtlTeamService } from '@iterpro/shared/data-access/sdk';
import { WithWyscoutFields } from '../mixins/wyscoutProviderField.mixin';
import { BaseEtlTeamThirdPartyService } from './baseEtlTeamThirdPartyService';

@Injectable({
	providedIn: 'root'
})
export class EtlTeamWyscoutService
	extends WithWyscoutFields(BaseEtlTeamThirdPartyService)
	implements ThirdPartyEtlTeamService
{
	constructor() {
		super();
	}
}
