import {
	AvailableProviderIdField,
	IProviderRecordFieldService,
	WithFieldConstructor
} from '@iterpro/shared/data-access/sdk';

export function WithWyscoutFields<T extends WithFieldConstructor<any>>(Base: T = class {} as any) {
	return class extends Base implements IProviderRecordFieldService {
		getProviderIdField(): AvailableProviderIdField {
			return 'wyscoutId';
		}
		getProviderTeamIdField(): string {
			return 'wyscoutTeamId';
		}
		getProviderSecondaryTeamIdField(): string {
			return 'wyscoutSecondaryTeamId';
		}
		getProviderShortIdField(): string {
			return 'wyId';
		}
		getProviderCompetitionIdField(): string {
			return 'wyscoutCompetitionId';
		}
		getProviderSeasonIdField(): string {
			return 'wyscoutSeasonId';
		}
		getProviderCurrentTeamIdField(): string {
			return 'currentWyscoutTeamId';
		}
		getProviderAlternateShortIdField(): string {
			return 'wyd';
		}
		getProviderSyncedField(): string {
			return 'wyscoutSynced';
		}
		getProviderNationalLeagueField(): string {
			return 'wyscoutNationalLeague';
		}
		getProviderNationalCupField(): string {
			return 'wyscoutNationalCup';
		}
		getProviderTournamentQualifiersField(): string {
			return 'wyscoutTournamentQualifiers';
		}
		getProviderTournamentFinalStagesField(): string {
			return 'wyscoutTournamentFinalStages';
		}
		getProviderStandingTeamsFilterField(): string {
			return 'wyscoutStandingTeamsFilter';
		}
		getProviderSecondaryIdField(): string {
			return 'secondaryWyscoutId';
		}
	};
}
