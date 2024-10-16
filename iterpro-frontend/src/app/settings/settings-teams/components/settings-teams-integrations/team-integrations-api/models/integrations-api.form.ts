import { IntegrationApiForm, IntegrationApiPlayer, IntegrationApiPlayerMapping } from './integrations-api.type';
import { FormArray, FormControl, FormGroup } from '@angular/forms';


export function toIntegrationsApiForm(players: IntegrationApiPlayer[]): IntegrationApiForm {
	return {
		playersMapping: new FormArray(players.map(player => toIntegrationApiPlayerMapping(player)))
	}
}

function toIntegrationApiPlayerMapping(player: IntegrationApiPlayer): FormGroup<IntegrationApiPlayerMapping> {
	return new FormGroup({
		playerId: new FormControl({ value: player.id, disabled: true }),
		wyscoutId: new FormControl({ value: player.wyscoutId, disabled: true }),
		gpexeId: new FormControl({ value: player.gpexeId, disabled: true }),
		statsportId: new FormControl({ value: player.statsportId, disabled: true }),
		catapultId: new FormControl({ value: player.catapultId, disabled: true }),
		fieldwizId: new FormControl({ value: player.fieldwizId, disabled: true }),
		sonraId: new FormControl({ value: player.sonraId, disabled: true }),
		wimuId: new FormControl({ value: player.wimuId, disabled: true }),
		wyscoutSecondaryTeamId: new FormControl({ value: player.wyscoutSecondaryTeamId, disabled: true })
	});
}
