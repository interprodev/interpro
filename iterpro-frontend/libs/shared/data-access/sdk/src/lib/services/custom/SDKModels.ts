/* tslint:disable */
import { Injectable } from '@angular/core';
import { User } from '../../models/User';
import { AccessToken } from '../../models/AccessToken';
import { ACL } from '../../models/ACL';
import { RoleMapping } from '../../models/RoleMapping';
import { Role } from '../../models/Role';
import { Customer } from '../../models/Customer';
import { CustomerPlayer } from '../../models/CustomerPlayer';
import { EntityChangelog } from '../../models/EntityChangelog';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { SessionImportData } from '../../models/SessionImportData';
import { SessionPlayerData } from '../../models/SessionPlayerData';
import { Drill } from '../../models/Drill';
import { Test } from '../../models/Test';
import { Wellness } from '../../models/Wellness';
import { TeamStat } from '../../models/TeamStat';
import { PlayerStat } from '../../models/PlayerStat';
import { Match } from '../../models/Match';
import { TacticsData } from '../../models/TacticsData';
import { Threshold } from '../../models/Threshold';
import { ThresholdAutoGenSetting } from '../../models/ThresholdAutoGenSetting';
import { GOScore } from '../../models/GOScore';
import { Event } from '../../models/Event';
import { Injury } from '../../models/Injury';
import { InjuryAssessment } from '../../models/InjuryAssessment';
import { InjuryExam } from '../../models/InjuryExam';
import { InjuryTreatment } from '../../models/InjuryTreatment';
import { DrillInstance } from '../../models/DrillInstance';
import { TestInstance } from '../../models/TestInstance';
import { TeamGroup } from '../../models/TeamGroup';
import { CustomerTeamSettings } from '../../models/CustomerTeamSettings';
import { Attachment } from '../../models/Attachment';
import { TestResult } from '../../models/TestResult';
import { Notification } from '../../models/Notification';
import { TacticsPlayerData } from '../../models/TacticsPlayerData';
import { PlayerApp } from '../../models/PlayerApp';
import { SessionsStats } from '../../models/SessionsStats';
import { ComparePlayersStats } from '../../models/ComparePlayersStats';
import { ProfilePlayers } from '../../models/ProfilePlayers';
import { Robustness } from '../../models/Robustness';
import { PlanningView } from '../../models/PlanningView';
import { Utils } from '../../models/Utils';
import { Readiness } from '../../models/Readiness';
import { TeamSeason } from '../../models/TeamSeason';
import { PlayerMatchStat } from '../../models/PlayerMatchStat';
import { ChronicInjury } from '../../models/ChronicInjury';
import { AzureStorage } from '../../models/AzureStorage';
import { Storage } from '../../models/Storage';
import { Wyscout } from '../../models/Wyscout';
import { Instat } from '../../models/Instat';
import { Thirdparty } from '../../models/Thirdparty';
import { Fieldwiz } from '../../models/Fieldwiz';
import { DirectorV2 } from '../../models/DirectorV2';
import { GpsProviderMapping } from '../../models/GpsProviderMapping';
import { TeamProviderMapping } from '../../models/TeamProviderMapping';
import { PlayerProviderMapping } from '../../models/PlayerProviderMapping';
import { GpsMetricMapping } from '../../models/GpsMetricMapping';
import { PlayerScouting } from '../../models/PlayerScouting';
import { Club } from '../../models/Club';
import { Staff } from '../../models/Staff';
import { ClubTransfer } from '../../models/ClubTransfer';
import { ClubSeason } from '../../models/ClubSeason';
import { PlayerValue } from '../../models/PlayerValue';
import { Agent } from '../../models/Agent';
import { TransferWindow } from '../../models/TransferWindow';
import { PreventionExam } from '../../models/PreventionExam';
import { ScoutingLineup } from '../../models/ScoutingLineup';
import { VideoAsset } from '../../models/VideoAsset';
import { PlayerDescriptionEntry } from '../../models/PlayerDescriptionEntry';
import { PlayerAttributesEntry } from '../../models/PlayerAttributesEntry';
import { PlayerNotification } from '../../models/PlayerNotification';
import { ScoutingGame } from '../../models/ScoutingGame';
import { PlayerCalculatedData } from '../../models/PlayerCalculatedData';
import { ScoutingLineupPlayerData } from '../../models/ScoutingLineupPlayerData';
import { PlayerGameReport } from '../../models/PlayerGameReport';
import { PlayerTrainingReport } from '../../models/PlayerTrainingReport';
import { ScoutingGameReport } from '../../models/ScoutingGameReport';
import { ScoutingLineupRoleData } from '../../models/ScoutingLineupRoleData';
import { Coaching } from '../../models/Coaching';
import { Chat } from '../../models/Chat';
import { MedicalTreatment } from '../../models/MedicalTreatment';
import { PlayerCostItem } from '../../models/PlayerCostItem';
import { PersonCostItem } from '../../models/PersonCostItem';
import { TeamTableFilterTemplate } from '../../models/TeamTableFilterTemplate';
import { AgentContract } from '../../models/AgentContract';
import { EmploymentContract } from '../../models/EmploymentContract';
import { TransferContract } from '../../models/TransferContract';
import { ContractOption } from '../../models/ContractOption';
import { Bonus } from '../../models/Bonus';
import { BasicWage } from '../../models/BasicWage';
import { TransferClause } from '../../models/TransferClause';
import { LoanOption } from '../../models/LoanOption';
import { TeamBonus } from '../../models/TeamBonus';
import { ContractOptionCondition } from '../../models/ContractOptionCondition';
import { PlayerTransfer } from '../../models/PlayerTransfer';

export interface Models { [name: string]: any }

@Injectable()
export class SDKModels {

  private models: Models = {
    User: User,
    AccessToken: AccessToken,
    ACL: ACL,
    RoleMapping: RoleMapping,
    Role: Role,
    Customer: Customer,
    CustomerPlayer: CustomerPlayer,
    EntityChangelog: EntityChangelog,
    Team: Team,
    Player: Player,
    SessionImportData: SessionImportData,
    SessionPlayerData: SessionPlayerData,
    Drill: Drill,
    Test: Test,
    Wellness: Wellness,
    TeamStat: TeamStat,
    PlayerStat: PlayerStat,
    Match: Match,
    TacticsData: TacticsData,
    Threshold: Threshold,
    ThresholdAutoGenSetting: ThresholdAutoGenSetting,
    GOScore: GOScore,
    Event: Event,
    Injury: Injury,
    InjuryAssessment: InjuryAssessment,
    InjuryExam: InjuryExam,
    InjuryTreatment: InjuryTreatment,
    DrillInstance: DrillInstance,
    TestInstance: TestInstance,
    TeamGroup: TeamGroup,
    CustomerTeamSettings: CustomerTeamSettings,
    Attachment: Attachment,
    TestResult: TestResult,
    Notification: Notification,
    TacticsPlayerData: TacticsPlayerData,
    PlayerApp: PlayerApp,
    SessionsStats: SessionsStats,
    ComparePlayersStats: ComparePlayersStats,
    ProfilePlayers: ProfilePlayers,
    Robustness: Robustness,
    PlanningView: PlanningView,
    Utils: Utils,
    Readiness: Readiness,
    TeamSeason: TeamSeason,
    PlayerMatchStat: PlayerMatchStat,
    ChronicInjury: ChronicInjury,
    AzureStorage: AzureStorage,
    Storage: Storage,
    Wyscout: Wyscout,
    Instat: Instat,
    Thirdparty: Thirdparty,
    Fieldwiz: Fieldwiz,
    DirectorV2: DirectorV2,
    GpsProviderMapping: GpsProviderMapping,
    TeamProviderMapping: TeamProviderMapping,
    PlayerProviderMapping: PlayerProviderMapping,
    GpsMetricMapping: GpsMetricMapping,
    PlayerScouting: PlayerScouting,
    Club: Club,
    Staff: Staff,
    ClubTransfer: ClubTransfer,
    ClubSeason: ClubSeason,
    PlayerValue: PlayerValue,
    Agent: Agent,
    TransferWindow: TransferWindow,
    PreventionExam: PreventionExam,
    ScoutingLineup: ScoutingLineup,
    VideoAsset: VideoAsset,
    PlayerDescriptionEntry: PlayerDescriptionEntry,
    PlayerAttributesEntry: PlayerAttributesEntry,
    PlayerNotification: PlayerNotification,
    ScoutingGame: ScoutingGame,
    PlayerCalculatedData: PlayerCalculatedData,
    ScoutingLineupPlayerData: ScoutingLineupPlayerData,
    PlayerGameReport: PlayerGameReport,
    PlayerTrainingReport: PlayerTrainingReport,
    ScoutingGameReport: ScoutingGameReport,
    ScoutingLineupRoleData: ScoutingLineupRoleData,
    Coaching: Coaching,
    Chat: Chat,
    MedicalTreatment: MedicalTreatment,
    PlayerCostItem: PlayerCostItem,
    PersonCostItem: PersonCostItem,
    TeamTableFilterTemplate: TeamTableFilterTemplate,
    AgentContract: AgentContract,
    EmploymentContract: EmploymentContract,
    TransferContract: TransferContract,
    ContractOption: ContractOption,
    Bonus: Bonus,
    BasicWage: BasicWage,
    TransferClause: TransferClause,
    LoanOption: LoanOption,
    TeamBonus: TeamBonus,
    ContractOptionCondition: ContractOptionCondition,
    PlayerTransfer: PlayerTransfer,
    
  };

  public get(modelName: string): any {
    return this.models[modelName];
  }

  public getAll(): Models {
    return this.models;
  }

  public getModelNames(): string[] {
    return Object.keys(this.models);
  }
}
