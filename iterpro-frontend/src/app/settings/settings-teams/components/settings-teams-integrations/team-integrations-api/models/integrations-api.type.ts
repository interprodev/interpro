import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Player } from '@iterpro/shared/data-access/sdk';

// region IntegrationApiForm
export type IntegrationApiPlayer = Pick<Player, 'id' | 'downloadUrl' | 'displayName' | 'instatId' | 'wyscoutId' | 'gpexeId'
	| 'statsportId' | 'catapultId' | 'fieldwizId' | 'sonraId'
	| 'wimuId' | 'wyscoutSecondaryTeamId' | '_thresholds' | 'archived' | 'archivedDate'
	| 'gender' | 'weight' | 'height' | 'birthDate'>;

export type IntegrationApiPlayerMapping = {
	playerId: FormControl<string>;
	wyscoutId: FormControl<number>;
	gpexeId: FormControl<number>;
	statsportId: FormControl<string>;
	catapultId: FormControl<string>;
	fieldwizId: FormControl<string>;
	sonraId: FormControl<string>;
	wimuId: FormControl<string>;
	wyscoutSecondaryTeamId: FormControl<number>;
}

export type IntegrationApiForm = {
	playersMapping: FormArray<FormGroup<IntegrationApiPlayerMapping>>;
}

// endregion



export interface ThirdPartyPlayer {
	_id: number;
	playerKey: 'wyscoutId' | 'instatId';
	firstName: string;
	shortName: string;
	middleName: string;
	lastName: string;
	height: number;
	weight: number;
	birthDate: Date;
	secondaryWyscoutId?: number;
	instatSecondaryTeamId?: number;
}

export interface UpdateThirdPartyPlayerPayload {
	playerId: string;
	wyscoutId: number;
	gpexeId: number;
	statsportId: string;
	catapultId: string;
	fieldwizId: string;
	sonraId: string;
	wimuId: string;
	wyscoutSecondaryTeamId: number;
}

export interface SecondaryTeamInfo {
	wyId: number;
	currentTeamId: number;
	currentTeamName: string;
	nationalTeamId: number;
}

export interface FieldwizAthleteProfile {
	external_id: string;
	first_name: string;
	last_name: string;
	gender: string;
	weight: number;
	height: number;
	birth_date: string;
	max_heart_rate: number;
}
