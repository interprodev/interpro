/* tslint:disable */
import {
  Team,
  Customer
} from '../index';

declare var Object: any;
export interface CustomerTeamSettingsInterface {
  "admin"?: boolean;
  "position"?: string;
  "debug"?: boolean;
  "permissions"?: any;
  "mobilePermissions"?: any;
  "pinnedTestsIds"?: any;
  "notificationRehab"?: boolean;
  "notificationImport"?: boolean;
  "notificationReadiness"?: boolean;
  "notificationEwma"?: boolean;
  "notificationInjury"?: boolean;
  "notificationAppearanceFee"?: boolean;
  "notificationPerformanceFee"?: boolean;
  "notificationAppearanceBonuses"?: any;
  "notificationPerformanceBonuses"?: any;
  "notificationStandardTeamBonuses"?: boolean;
  "notificationValorization"?: boolean;
  "notificationClinicalRecords"?: number;
  "notificationContractExpiration"?: number;
  "notificationCostItemExpiration"?: number;
  "notificationDocumentsDays"?: number;
  "notificationPlayerOperations"?: boolean;
  "notificationBonusPaidOverdue"?: boolean;
  "notificationClubBonusPaidOverdue"?: boolean;
  "notificationClubBonus"?: boolean;
  "notificationFinancialCapitalGainLoss"?: boolean;
  "notificationFinancialLossesByInjury"?: any;
  "notificationFinancialRoi"?: any;
  "notificationInstallments"?: boolean;
  "notificationPlayerVideoComment"?: boolean;
  "notificationEventInvitation"?: boolean;
  "notificationEventReminder"?: any;
  "notificationVideoSharing"?: boolean;
  "notificationVideoComment"?: boolean;
  "metricsPerformance"?: any;
  "metricsTeamTactical"?: any;
  "metricsIndividualTactical"?: any;
  "landingPage"?: string;
  "tableFilterTemplateIds"?: any;
  "calendarSettings"?: any;
  "notificationWorkloadScore"?: any;
  "id"?: any;
  "teamId"?: any;
  "customerId"?: any;
  team?: Team;
  customer?: Customer;
}

export class CustomerTeamSettings implements CustomerTeamSettingsInterface {
  "admin": boolean;
  "position": string;
  "debug": boolean;
  "permissions": any;
  "mobilePermissions": any;
  "pinnedTestsIds": any;
  "notificationRehab": boolean;
  "notificationImport": boolean;
  "notificationReadiness": boolean;
  "notificationEwma": boolean;
  "notificationInjury": boolean;
  "notificationAppearanceFee": boolean;
  "notificationPerformanceFee": boolean;
  "notificationAppearanceBonuses": any;
  "notificationPerformanceBonuses": any;
  "notificationStandardTeamBonuses": boolean;
  "notificationValorization": boolean;
  "notificationClinicalRecords": number;
  "notificationContractExpiration": number;
  "notificationCostItemExpiration": number;
  "notificationDocumentsDays": number;
  "notificationPlayerOperations": boolean;
  "notificationBonusPaidOverdue": boolean;
  "notificationClubBonusPaidOverdue": boolean;
  "notificationClubBonus": boolean;
  "notificationFinancialCapitalGainLoss": boolean;
  "notificationFinancialLossesByInjury": any;
  "notificationFinancialRoi": any;
  "notificationInstallments": boolean;
  "notificationPlayerVideoComment": boolean;
  "notificationEventInvitation": boolean;
  "notificationEventReminder": any;
  "notificationVideoSharing": boolean;
  "notificationVideoComment": boolean;
  "metricsPerformance": any;
  "metricsTeamTactical": any;
  "metricsIndividualTactical": any;
  "landingPage": string;
  "tableFilterTemplateIds": any;
  "calendarSettings": any;
  "notificationWorkloadScore": any;
  "id": any;
  "teamId": any;
  "customerId": any;
  team: Team;
  customer: Customer;
  constructor(data?: CustomerTeamSettingsInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `CustomerTeamSettings`.
   */
  public static getModelName() {
    return "CustomerTeamSettings";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of CustomerTeamSettings for dynamic purposes.
  **/
  public static factory(data: CustomerTeamSettingsInterface): CustomerTeamSettings{
    return new CustomerTeamSettings(data);
  }
  /**
  * @method getModelDefinition
  * @author Julien Ledun
  * @license MIT
  * This method returns an object that represents some of the model
  * definitions.
  **/
  public static getModelDefinition() {
    return {
      name: 'CustomerTeamSettings',
      plural: 'CustomerTeamSettings',
      path: 'CustomerTeamSettings',
      idName: 'id',
      properties: {
        "admin": {
          name: 'admin',
          type: 'boolean',
          default: false
        },
        "position": {
          name: 'position',
          type: 'string'
        },
        "debug": {
          name: 'debug',
          type: 'boolean',
          default: false
        },
        "permissions": {
          name: 'permissions',
          type: 'any'
        },
        "mobilePermissions": {
          name: 'mobilePermissions',
          type: 'any'
        },
        "pinnedTestsIds": {
          name: 'pinnedTestsIds',
          type: 'any',
          default: <any>null
        },
        "notificationRehab": {
          name: 'notificationRehab',
          type: 'boolean',
          default: false
        },
        "notificationImport": {
          name: 'notificationImport',
          type: 'boolean',
          default: false
        },
        "notificationReadiness": {
          name: 'notificationReadiness',
          type: 'boolean',
          default: false
        },
        "notificationEwma": {
          name: 'notificationEwma',
          type: 'boolean',
          default: false
        },
        "notificationInjury": {
          name: 'notificationInjury',
          type: 'boolean',
          default: false
        },
        "notificationAppearanceFee": {
          name: 'notificationAppearanceFee',
          type: 'boolean',
          default: false
        },
        "notificationPerformanceFee": {
          name: 'notificationPerformanceFee',
          type: 'boolean',
          default: false
        },
        "notificationAppearanceBonuses": {
          name: 'notificationAppearanceBonuses',
          type: 'any',
          default: <any>null
        },
        "notificationPerformanceBonuses": {
          name: 'notificationPerformanceBonuses',
          type: 'any',
          default: <any>null
        },
        "notificationStandardTeamBonuses": {
          name: 'notificationStandardTeamBonuses',
          type: 'boolean',
          default: false
        },
        "notificationValorization": {
          name: 'notificationValorization',
          type: 'boolean',
          default: false
        },
        "notificationClinicalRecords": {
          name: 'notificationClinicalRecords',
          type: 'number',
          default: 0
        },
        "notificationContractExpiration": {
          name: 'notificationContractExpiration',
          type: 'number',
          default: 0
        },
        "notificationCostItemExpiration": {
          name: 'notificationCostItemExpiration',
          type: 'number',
          default: 0
        },
        "notificationDocumentsDays": {
          name: 'notificationDocumentsDays',
          type: 'number',
          default: 0
        },
        "notificationPlayerOperations": {
          name: 'notificationPlayerOperations',
          type: 'boolean',
          default: false
        },
        "notificationBonusPaidOverdue": {
          name: 'notificationBonusPaidOverdue',
          type: 'boolean',
          default: false
        },
        "notificationClubBonusPaidOverdue": {
          name: 'notificationClubBonusPaidOverdue',
          type: 'boolean',
          default: false
        },
        "notificationClubBonus": {
          name: 'notificationClubBonus',
          type: 'boolean',
          default: false
        },
        "notificationFinancialCapitalGainLoss": {
          name: 'notificationFinancialCapitalGainLoss',
          type: 'boolean',
          default: false
        },
        "notificationFinancialLossesByInjury": {
          name: 'notificationFinancialLossesByInjury',
          type: 'any',
          default: <any>null
        },
        "notificationFinancialRoi": {
          name: 'notificationFinancialRoi',
          type: 'any',
          default: <any>null
        },
        "notificationInstallments": {
          name: 'notificationInstallments',
          type: 'boolean',
          default: false
        },
        "notificationPlayerVideoComment": {
          name: 'notificationPlayerVideoComment',
          type: 'boolean',
          default: false
        },
        "notificationEventInvitation": {
          name: 'notificationEventInvitation',
          type: 'boolean',
          default: false
        },
        "notificationEventReminder": {
          name: 'notificationEventReminder',
          type: 'any'
        },
        "notificationVideoSharing": {
          name: 'notificationVideoSharing',
          type: 'boolean',
          default: false
        },
        "notificationVideoComment": {
          name: 'notificationVideoComment',
          type: 'boolean',
          default: false
        },
        "metricsPerformance": {
          name: 'metricsPerformance',
          type: 'any'
        },
        "metricsTeamTactical": {
          name: 'metricsTeamTactical',
          type: 'any'
        },
        "metricsIndividualTactical": {
          name: 'metricsIndividualTactical',
          type: 'any'
        },
        "landingPage": {
          name: 'landingPage',
          type: 'string'
        },
        "tableFilterTemplateIds": {
          name: 'tableFilterTemplateIds',
          type: 'any',
          default: <any>null
        },
        "calendarSettings": {
          name: 'calendarSettings',
          type: 'any',
          default: <any>null
        },
        "notificationWorkloadScore": {
          name: 'notificationWorkloadScore',
          type: 'any',
          default: <any>null
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "customerId": {
          name: 'customerId',
          type: 'any'
        },
      },
      relations: {
        team: {
          name: 'team',
          type: 'Team',
          model: 'Team',
          relationType: 'belongsTo',
                  keyFrom: 'teamId',
          keyTo: 'id'
        },
        customer: {
          name: 'customer',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'customerId',
          keyTo: 'id'
        },
      }
    }
  }
}
