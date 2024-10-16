import {
	AvailableProviderIdField,
	IProviderRecordFieldService,
	WithFieldConstructor
} from '@iterpro/shared/data-access/sdk';

export function WithNoValidFields<T extends WithFieldConstructor<any>>(Base: T = class {} as any) {
	return class extends Base implements IProviderRecordFieldService {
		getProviderIdField(): AvailableProviderIdField | null {
			return null;
		}
		getProviderTeamIdField(): string | null {
			return null;
		}
		getProviderSecondaryTeamIdField(): string | null {
			return null;
		}
		getProviderShortIdField(): string | null {
			return null;
		}
		getProviderCompetitionIdField(): string | null {
			return null;
		}
		getProviderSeasonIdField(): string | null {
			return null;
		}
		getProviderCurrentTeamIdField(): string | null {
			return null;
		}
		getProviderAlternateShortIdField(): string | null {
			return null;
		}
		getProviderSyncedField(): string | null {
			return null;
		}
		getProviderNationalLeagueField(): string | null {
			return null;
		}
		getProviderNationalCupField(): string | null {
			return null;
		}
		getProviderTournamentQualifiersField(): string | null {
			return null;
		}
		getProviderTournamentFinalStagesField(): string | null {
			return null;
		}
		getProviderStandingTeamsFilterField(): string | null {
			return null;
		}
		getProviderSecondaryIdField(): string | null {
			return null;
		}
	};
}
