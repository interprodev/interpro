import { InstatApi, WyscoutApi } from '../../../lib';
import { IBaseEtlPlayerService } from './iBaseEtlPlayerService';
import { IBaseEtlTeamService } from './iBaseEtlTeamService';

export type DynamicType = 'Dynamic';
export type DeviceType = 'StatsportAPI' | 'Sonra' | 'Gpexe' | 'Catapult' | 'Fieldwiz' | 'Wimu' | DynamicType;
export type ProviderType = 'Wyscout' | 'InStat' | DynamicType;
export type ThirdPartyProviderApi = WyscoutApi | InstatApi;
export type ThirdPartyProviderApis = Record<Exclude<ProviderType, DynamicType>, ThirdPartyProviderApi>;
export type AvailableProviderIdField = 'wyscoutId' | 'instatId';
export type ThirdPartyEtlPlayerService = IBaseEtlPlayerService & IProviderRecordFieldService;
export type ThirdPartyEtlTeamService = IBaseEtlTeamService & IProviderRecordFieldService;
export type WithFieldConstructor<T> = new (...args: any[]) => T;

export interface IProviderRecordFieldService {
	getProviderIdField(): AvailableProviderIdField | null;
	getProviderShortIdField(): string | null;
	getProviderTeamIdField(): string | null;
	getProviderCompetitionIdField(): string | null;
	getProviderSeasonIdField(): string | null;
	getProviderCurrentTeamIdField(): string | null;
	getProviderSecondaryTeamIdField(): string | null;
	getProviderAlternateShortIdField(): string | null;
	getProviderSyncedField(): string | null;
	getProviderNationalLeagueField(): string | null;
	getProviderNationalCupField(): string | null;
	getProviderTournamentQualifiersField(): string | null;
	getProviderTournamentFinalStagesField(): string | null;
	getProviderStandingTeamsFilterField(): string | null;
	getProviderSecondaryIdField(): string | null;
}
