/* tslint:disable */
/**
* @module SDKModule
* @author Jonathan Casarrubias <t:@johncasarrubias>
	<gh:jonathan-casarrubias>
		* @license MIT 2016 Jonathan Casarrubias
		* @version 2.1.0
		* @description
		* The SDKModule is a generated Software Development Kit automatically built by
		* the LoopBack SDK Builder open source module.
		*
		* The SDKModule provides Angular 2 >= RC.5 support, which means that NgModules
		* can import this Software Development Kit as follows:
		*
		*
		* APP Route Module Context
		* ============================================================================
		* import { NgModule } from '@angular/core';
		* import { BrowserModule } from '@angular/platform-browser';
		* // App Root
		* import { AppComponent } from './app.component';
		* // Feature Modules
		* import { SDK[Browser|Node|Native]Module } from './shared/sdk/sdk.module';
		* // Import Routing
		* import { routing } from './app.routing';
		* @NgModule({
		* imports: [
		* BrowserModule,
		* routing,
		* SDK[Browser|Node|Native]Module.forRoot()
		* ],
		* declarations: [ AppComponent ],
		* bootstrap: [ AppComponent ]
		* })
		* export class AppModule { }
		*
		**/
		import { ErrorHandler } from './services/core/error.service';
import { LoopBackAuth } from './services/core/auth.service';
import { LoggerService } from './services/custom/logger.service';
import { SDKModels } from './services/custom/SDKModels';
import { InternalStorage, SDKStorage } from './storage/storage.swaps';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CookieBrowser } from './storage/cookie.browser';
import { StorageBrowser } from './storage/storage.browser';
import { SocketBrowser } from './sockets/socket.browser';
import { SocketDriver } from './sockets/socket.driver';
import { SocketConnection } from './sockets/socket.connections';
import { RealTime } from './services/core/real.time';
import { UserApi } from './services/custom/User';
import { AccessTokenApi } from './services/custom/AccessToken';
import { ACLApi } from './services/custom/ACL';
import { RoleMappingApi } from './services/custom/RoleMapping';
import { RoleApi } from './services/custom/Role';
import { CustomerApi } from './services/custom/Customer';
import { CustomerPlayerApi } from './services/custom/CustomerPlayer';
import { EntityChangelogApi } from './services/custom/EntityChangelog';
import { TeamApi } from './services/custom/Team';
import { PlayerApi } from './services/custom/Player';
import { SessionImportDataApi } from './services/custom/SessionImportData';
import { SessionPlayerDataApi } from './services/custom/SessionPlayerData';
import { DrillApi } from './services/custom/Drill';
import { TestApi } from './services/custom/Test';
import { WellnessApi } from './services/custom/Wellness';
import { TeamStatApi } from './services/custom/TeamStat';
import { PlayerStatApi } from './services/custom/PlayerStat';
import { MatchApi } from './services/custom/Match';
import { TacticsDataApi } from './services/custom/TacticsData';
import { ThresholdApi } from './services/custom/Threshold';
import { ThresholdAutoGenSettingApi } from './services/custom/ThresholdAutoGenSetting';
import { GOScoreApi } from './services/custom/GOScore';
import { EventApi } from './services/custom/Event';
import { InjuryApi } from './services/custom/Injury';
import { InjuryAssessmentApi } from './services/custom/InjuryAssessment';
import { InjuryExamApi } from './services/custom/InjuryExam';
import { InjuryTreatmentApi } from './services/custom/InjuryTreatment';
import { DrillInstanceApi } from './services/custom/DrillInstance';
import { TestInstanceApi } from './services/custom/TestInstance';
import { TeamGroupApi } from './services/custom/TeamGroup';
import { CustomerTeamSettingsApi } from './services/custom/CustomerTeamSettings';
import { AttachmentApi } from './services/custom/Attachment';
import { TestResultApi } from './services/custom/TestResult';
import { NotificationApi } from './services/custom/Notification';
import { TacticsPlayerDataApi } from './services/custom/TacticsPlayerData';
import { PlayerAppApi } from './services/custom/PlayerApp';
import { SessionsStatsApi } from './services/custom/SessionsStats';
import { ComparePlayersStatsApi } from './services/custom/ComparePlayersStats';
import { ProfilePlayersApi } from './services/custom/ProfilePlayers';
import { RobustnessApi } from './services/custom/Robustness';
import { PlanningViewApi } from './services/custom/PlanningView';
import { UtilsApi } from './services/custom/Utils';
import { ReadinessApi } from './services/custom/Readiness';
import { TeamSeasonApi } from './services/custom/TeamSeason';
import { PlayerMatchStatApi } from './services/custom/PlayerMatchStat';
import { ChronicInjuryApi } from './services/custom/ChronicInjury';
import { AzureStorageApi } from './services/custom/AzureStorage';
import { StorageApi } from './services/custom/Storage';
import { WyscoutApi } from './services/custom/Wyscout';
import { InstatApi } from './services/custom/Instat';
import { ThirdpartyApi } from './services/custom/Thirdparty';
import { FieldwizApi } from './services/custom/Fieldwiz';
import { DirectorV2Api } from './services/custom/DirectorV2';
import { GpsProviderMappingApi } from './services/custom/GpsProviderMapping';
import { TeamProviderMappingApi } from './services/custom/TeamProviderMapping';
import { PlayerProviderMappingApi } from './services/custom/PlayerProviderMapping';
import { GpsMetricMappingApi } from './services/custom/GpsMetricMapping';
import { PlayerScoutingApi } from './services/custom/PlayerScouting';
import { ClubApi } from './services/custom/Club';
import { StaffApi } from './services/custom/Staff';
import { ClubTransferApi } from './services/custom/ClubTransfer';
import { ClubSeasonApi } from './services/custom/ClubSeason';
import { PlayerValueApi } from './services/custom/PlayerValue';
import { AgentApi } from './services/custom/Agent';
import { TransferWindowApi } from './services/custom/TransferWindow';
import { PreventionExamApi } from './services/custom/PreventionExam';
import { ScoutingLineupApi } from './services/custom/ScoutingLineup';
import { VideoAssetApi } from './services/custom/VideoAsset';
import { PlayerDescriptionEntryApi } from './services/custom/PlayerDescriptionEntry';
import { PlayerAttributesEntryApi } from './services/custom/PlayerAttributesEntry';
import { PlayerNotificationApi } from './services/custom/PlayerNotification';
import { ScoutingGameApi } from './services/custom/ScoutingGame';
import { PlayerCalculatedDataApi } from './services/custom/PlayerCalculatedData';
import { ScoutingLineupPlayerDataApi } from './services/custom/ScoutingLineupPlayerData';
import { PlayerGameReportApi } from './services/custom/PlayerGameReport';
import { PlayerTrainingReportApi } from './services/custom/PlayerTrainingReport';
import { ScoutingGameReportApi } from './services/custom/ScoutingGameReport';
import { ScoutingLineupRoleDataApi } from './services/custom/ScoutingLineupRoleData';
import { CoachingApi } from './services/custom/Coaching';
import { ChatApi } from './services/custom/Chat';
import { MedicalTreatmentApi } from './services/custom/MedicalTreatment';
import { PlayerCostItemApi } from './services/custom/PlayerCostItem';
import { PersonCostItemApi } from './services/custom/PersonCostItem';
import { TeamTableFilterTemplateApi } from './services/custom/TeamTableFilterTemplate';
import { AgentContractApi } from './services/custom/AgentContract';
import { EmploymentContractApi } from './services/custom/EmploymentContract';
import { TransferContractApi } from './services/custom/TransferContract';
import { ContractOptionApi } from './services/custom/ContractOption';
import { BonusApi } from './services/custom/Bonus';
import { BasicWageApi } from './services/custom/BasicWage';
import { TransferClauseApi } from './services/custom/TransferClause';
import { LoanOptionApi } from './services/custom/LoanOption';
import { TeamBonusApi } from './services/custom/TeamBonus';
import { ContractOptionConditionApi } from './services/custom/ContractOptionCondition';
import { PlayerTransferApi } from './services/custom/PlayerTransfer';
							/**
				* @module SDKBrowserModule
				* @description
				* This module should be imported when building a Web Application in the following scenarios:
				*
				* 1.- Regular web application
				* 2.- Angular universal application (Browser Portion)
				* 3.- Progressive applications (Angular Mobile, Ionic, WebViews, etc)
				**/
				@NgModule({
				imports: [ CommonModule, HttpClientModule ],
				declarations: [ ],
				exports: [ ],
				providers: [
				ErrorHandler,
    SocketConnection
					]
					})
					export class SDKBrowserModule {
					static forRoot(internalStorageProvider: any = {
					provide: InternalStorage,
					useClass: CookieBrowser
					}): ModuleWithProviders<SDKBrowserModule> {
						return {
						ngModule : SDKBrowserModule,
						providers : [
						LoopBackAuth,
        LoggerService,
        SDKModels,
        RealTime,
        UserApi,
        AccessTokenApi,
        ACLApi,
        RoleMappingApi,
        RoleApi,
        CustomerApi,
        CustomerPlayerApi,
        EntityChangelogApi,
        TeamApi,
        PlayerApi,
        SessionImportDataApi,
        SessionPlayerDataApi,
        DrillApi,
        TestApi,
        WellnessApi,
        TeamStatApi,
        PlayerStatApi,
        MatchApi,
        TacticsDataApi,
        ThresholdApi,
        ThresholdAutoGenSettingApi,
        GOScoreApi,
        EventApi,
        InjuryApi,
        InjuryAssessmentApi,
        InjuryExamApi,
        InjuryTreatmentApi,
        DrillInstanceApi,
        TestInstanceApi,
        TeamGroupApi,
        CustomerTeamSettingsApi,
        AttachmentApi,
        TestResultApi,
        NotificationApi,
        TacticsPlayerDataApi,
        PlayerAppApi,
        SessionsStatsApi,
        ComparePlayersStatsApi,
        ProfilePlayersApi,
        RobustnessApi,
        PlanningViewApi,
        UtilsApi,
        ReadinessApi,
        TeamSeasonApi,
        PlayerMatchStatApi,
        ChronicInjuryApi,
        AzureStorageApi,
        StorageApi,
        WyscoutApi,
        InstatApi,
        ThirdpartyApi,
        FieldwizApi,
        DirectorV2Api,
        GpsProviderMappingApi,
        TeamProviderMappingApi,
        PlayerProviderMappingApi,
        GpsMetricMappingApi,
        PlayerScoutingApi,
        ClubApi,
        StaffApi,
        ClubTransferApi,
        ClubSeasonApi,
        PlayerValueApi,
        AgentApi,
        TransferWindowApi,
        PreventionExamApi,
        ScoutingLineupApi,
        VideoAssetApi,
        PlayerDescriptionEntryApi,
        PlayerAttributesEntryApi,
        PlayerNotificationApi,
        ScoutingGameApi,
        PlayerCalculatedDataApi,
        ScoutingLineupPlayerDataApi,
        PlayerGameReportApi,
        PlayerTrainingReportApi,
        ScoutingGameReportApi,
        ScoutingLineupRoleDataApi,
        CoachingApi,
        ChatApi,
        MedicalTreatmentApi,
        PlayerCostItemApi,
        PersonCostItemApi,
        TeamTableFilterTemplateApi,
        AgentContractApi,
        EmploymentContractApi,
        TransferContractApi,
        ContractOptionApi,
        BonusApi,
        BasicWageApi,
        TransferClauseApi,
        LoanOptionApi,
        TeamBonusApi,
        ContractOptionConditionApi,
        PlayerTransferApi,
        internalStorageProvider,
        { provide: SDKStorage, useClass: StorageBrowser },
        { provide: SocketDriver, useClass: SocketBrowser }
							]
							};
							}
							}
																																														/**
																		* Have Fun!!!
																		* - Jon
																		**/
																		export * from './models/index';
																		export * from './services/index';
																		export * from './lb.config';
																																					export * from './storage/storage.swaps';
																			export { CookieBrowser } from './storage/cookie.browser';
																			export { StorageBrowser } from './storage/storage.browser';
																			
																				