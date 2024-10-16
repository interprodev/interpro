import {
	AvailableProviderIdField,
	IProviderRecordFieldService,
	WithFieldConstructor
} from '@iterpro/shared/data-access/sdk';

export function WithInStatFields<T extends WithFieldConstructor<any>>(Base: T = class {} as any) {
	return class extends Base implements IProviderRecordFieldService {
		getProviderIdField(): AvailableProviderIdField {
			return 'instatId';
		}
		getProviderTeamIdField(): string {
			return 'instatTeamId';
		}
		getProviderSecondaryTeamIdField(): string {
			return 'instatSecondaryTeamId';
		}
		getProviderShortIdField(): string {
			return 'instId';
		}
		getProviderCompetitionIdField(): string {
			return 'instatCompetitionId';
		}
		getProviderSeasonIdField(): string {
			return 'instatSeasonId';
		}
		getProviderCurrentTeamIdField(): string {
			return 'currentInstatTeamId';
		}
		getProviderAlternateShortIdField(): string {
			return 'instd';
		}
		getProviderSyncedField(): string {
			return 'instatSynced';
		}
		getProviderNationalLeagueField(): string {
			return 'instatNationalLeague';
		}
		getProviderNationalCupField(): string {
			return 'instatNationalCup';
		}
		getProviderTournamentQualifiersField(): string {
			return 'instatTournamentQualifiers';
		}
		getProviderTournamentFinalStagesField(): string {
			return 'instatTournamentFinalStages';
		}
		getProviderStandingTeamsFilterField(): string {
			return 'instatStandingTeamsFilter';
		}
		getProviderSecondaryIdField(): string {
			return 'secondaryInstatId';
		}
	};
}
