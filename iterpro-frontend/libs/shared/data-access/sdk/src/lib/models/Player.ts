/* tslint:disable */
import {
  Team,
  CustomerPlayer,
  SessionPlayerData,
  Wellness,
  PlayerStat,
  Threshold,
  ThresholdAutoGenSetting,
  GOScore,
  Injury,
  ChronicInjury,
  Club,
  ClubTransfer,
  PlayerValue,
  PreventionExam,
  VideoAsset,
  PlayerDescriptionEntry,
  PlayerAttributesEntry,
  PlayerGameReport,
  PlayerTrainingReport,
  MedicalTreatment,
  PersonCostItem,
  EmploymentContract,
  TransferContract
} from '../index';

declare var Object: any;
export interface PlayerInterface {
  "instatId"?: number;
  "instatTeamId"?: number;
  "instatSecondaryTeamId"?: number;
  "wyscoutId"?: number;
  "wyscoutTeamId"?: number;
  "wyscoutSecondaryTeamId"?: number;
  "gpexeId"?: number;
  "catapultId"?: any;
  "fieldwizId"?: any;
  "sonraId"?: any;
  "statsportId"?: any;
  "wimuId"?: string;
  "name"?: string;
  "lastName"?: string;
  "displayName"?: string;
  "profilePhotoName"?: string;
  "profilePhotoUrl"?: string;
  "downloadUrl"?: string;
  "gender"?: string;
  "nationality"?: string;
  "altNationality"?: string;
  "passport"?: string;
  "altPassport"?: string;
  "shoeSize"?: string;
  "captain"?: boolean;
  "additionalInfo"?: string;
  "inTeamFrom"?: Date;
  "inTeamTo"?: Date;
  "facebook"?: string;
  "twitter"?: string;
  "instagram"?: string;
  "linkedin"?: string;
  "snapchat"?: string;
  "mobilePhone"?: string;
  "otherMobile"?: any;
  "education"?: string;
  "school"?: string;
  "birthDate"?: Date;
  "birthPlace"?: string;
  "weight"?: number;
  "height"?: number;
  "position"?: string;
  "role1"?: Array<any>;
  "position2"?: string;
  "role2"?: Array<any>;
  "position3"?: string;
  "role3"?: Array<any>;
  "foot"?: string;
  "jersey"?: number;
  "valueField"?: string;
  "value"?: number;
  "transfermarktValue"?: number;
  "clubValue"?: number;
  "agentValue"?: number;
  "wage"?: number;
  "contractStart"?: Date;
  "contractEnd"?: Date;
  "phone"?: string;
  "email"?: string;
  "address"?: any;
  "domicile"?: any;
  "botId"?: string;
  "botMessageUrl"?: string;
  "anamnesys"?: any;
  "_thresholds"?: any;
  "archived"?: boolean;
  "archivedDate"?: Date;
  "archivedMotivation"?: string;
  "currentStatus"?: string;
  "statusDetails"?: any;
  "movOnBall"?: Array<any>;
  "movOffBall"?: Array<any>;
  "passing"?: Array<any>;
  "finishing"?: Array<any>;
  "defending"?: Array<any>;
  "technique"?: Array<any>;
  "documents"?: Array<any>;
  "nationalityOrigin"?: string;
  "fiscalIssue"?: string;
  "ageGroup"?: string;
  "biography"?: string;
  "federalId"?: string;
  "federalMembership"?: Array<any>;
  "sportPassport"?: Array<any>;
  "maritalStatus"?: string;
  "_statusHistory"?: Array<any>;
  "deleted"?: boolean;
  "bankAccount"?: any;
  "firstFederalMembership"?: Date;
  "transferNotesThreads"?: Array<any>;
  "id"?: any;
  "teamId"?: any;
  "_thresholdsPlayer"?: Array<any>;
  "_thresholdsTests"?: Array<any>;
  "_thresholdsAttendances"?: Array<any>;
  "_thresholdsMedical"?: Array<any>;
  "_thresholdsFinancial"?: Array<any>;
  "_thresholdsAutoGenSettings"?: Array<any>;
  "_chronicInjuries"?: Array<any>;
  "clubId"?: any;
  "_pastValues"?: Array<any>;
  "_pastTransfermarktValues"?: Array<any>;
  "_pastAgentValues"?: Array<any>;
  "_pastClubValues"?: Array<any>;
  "_preventionExams"?: Array<any>;
  team?: Team;
  customerPlayer?: CustomerPlayer;
  sessionPlayerData?: SessionPlayerData[];
  wellnesses?: Wellness[];
  playerStats?: PlayerStat[];
  thresholdsPlayer?: Threshold[];
  thresholdsTests?: Threshold[];
  thresholdsAttendances?: Threshold[];
  thresholdsMedical?: Threshold[];
  thresholdsFinancial?: Threshold[];
  thresholdsAutoGenSettings?: ThresholdAutoGenSetting[];
  goScores?: GOScore[];
  injuries?: Injury[];
  chronicInjuries?: ChronicInjury[];
  club?: Club;
  transfer?: ClubTransfer;
  pastValues?: PlayerValue[];
  pastTransfermarktValues?: PlayerValue[];
  pastAgentValues?: PlayerValue[];
  pastClubValues?: PlayerValue[];
  preventionExams?: PreventionExam[];
  videos?: VideoAsset[];
  descriptions?: PlayerDescriptionEntry[];
  attributes?: PlayerAttributesEntry[];
  gameReports?: PlayerGameReport[];
  trainingReports?: PlayerTrainingReport[];
  medicalTreatments?: MedicalTreatment[];
  costItems?: PersonCostItem[];
  employmentContracts?: EmploymentContract[];
  transferContracts?: TransferContract[];
}

export class Player implements PlayerInterface {
  "instatId": number;
  "instatTeamId": number;
  "instatSecondaryTeamId": number;
  "wyscoutId": number;
  "wyscoutTeamId": number;
  "wyscoutSecondaryTeamId": number;
  "gpexeId": number;
  "catapultId": any;
  "fieldwizId": any;
  "sonraId": any;
  "statsportId": any;
  "wimuId": string;
  "name": string;
  "lastName": string;
  "displayName": string;
  "profilePhotoName": string;
  "profilePhotoUrl": string;
  "downloadUrl": string;
  "gender": string;
  "nationality": string;
  "altNationality": string;
  "passport": string;
  "altPassport": string;
  "shoeSize": string;
  "captain": boolean;
  "additionalInfo": string;
  "inTeamFrom": Date;
  "inTeamTo": Date;
  "facebook": string;
  "twitter": string;
  "instagram": string;
  "linkedin": string;
  "snapchat": string;
  "mobilePhone": string;
  "otherMobile": any;
  "education": string;
  "school": string;
  "birthDate": Date;
  "birthPlace": string;
  "weight": number;
  "height": number;
  "position": string;
  "role1": Array<any>;
  "position2": string;
  "role2": Array<any>;
  "position3": string;
  "role3": Array<any>;
  "foot": string;
  "jersey": number;
  "valueField": string;
  "value": number;
  "transfermarktValue": number;
  "clubValue": number;
  "agentValue": number;
  "wage": number;
  "contractStart": Date;
  "contractEnd": Date;
  "phone": string;
  "email": string;
  "address": any;
  "domicile": any;
  "botId": string;
  "botMessageUrl": string;
  "anamnesys": any;
  "_thresholds": any;
  "archived": boolean;
  "archivedDate": Date;
  "archivedMotivation": string;
  "currentStatus": string;
  "statusDetails": any;
  "movOnBall": Array<any>;
  "movOffBall": Array<any>;
  "passing": Array<any>;
  "finishing": Array<any>;
  "defending": Array<any>;
  "technique": Array<any>;
  "documents": Array<any>;
  "nationalityOrigin": string;
  "fiscalIssue": string;
  "ageGroup": string;
  "biography": string;
  "federalId": string;
  "federalMembership": Array<any>;
  "sportPassport": Array<any>;
  "maritalStatus": string;
  "_statusHistory": Array<any>;
  "deleted": boolean;
  "bankAccount": any;
  "firstFederalMembership": Date;
  "transferNotesThreads": Array<any>;
  "id": any;
  "teamId": any;
  "_thresholdsPlayer": Array<any>;
  "_thresholdsTests": Array<any>;
  "_thresholdsAttendances": Array<any>;
  "_thresholdsMedical": Array<any>;
  "_thresholdsFinancial": Array<any>;
  "_thresholdsAutoGenSettings": Array<any>;
  "_chronicInjuries": Array<any>;
  "clubId": any;
  "_pastValues": Array<any>;
  "_pastTransfermarktValues": Array<any>;
  "_pastAgentValues": Array<any>;
  "_pastClubValues": Array<any>;
  "_preventionExams": Array<any>;
  team: Team;
  customerPlayer: CustomerPlayer;
  sessionPlayerData: SessionPlayerData[];
  wellnesses: Wellness[];
  playerStats: PlayerStat[];
  thresholdsPlayer: Threshold[];
  thresholdsTests: Threshold[];
  thresholdsAttendances: Threshold[];
  thresholdsMedical: Threshold[];
  thresholdsFinancial: Threshold[];
  thresholdsAutoGenSettings: ThresholdAutoGenSetting[];
  goScores: GOScore[];
  injuries: Injury[];
  chronicInjuries: ChronicInjury[];
  club: Club;
  transfer: ClubTransfer;
  pastValues: PlayerValue[];
  pastTransfermarktValues: PlayerValue[];
  pastAgentValues: PlayerValue[];
  pastClubValues: PlayerValue[];
  preventionExams: PreventionExam[];
  videos: VideoAsset[];
  descriptions: PlayerDescriptionEntry[];
  attributes: PlayerAttributesEntry[];
  gameReports: PlayerGameReport[];
  trainingReports: PlayerTrainingReport[];
  medicalTreatments: MedicalTreatment[];
  costItems: PersonCostItem[];
  employmentContracts: EmploymentContract[];
  transferContracts: TransferContract[];
  constructor(data?: PlayerInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Player`.
   */
  public static getModelName() {
    return "Player";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Player for dynamic purposes.
  **/
  public static factory(data: PlayerInterface): Player{
    return new Player(data);
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
      name: 'Player',
      plural: 'players',
      path: 'players',
      idName: 'id',
      properties: {
        "instatId": {
          name: 'instatId',
          type: 'number'
        },
        "instatTeamId": {
          name: 'instatTeamId',
          type: 'number'
        },
        "instatSecondaryTeamId": {
          name: 'instatSecondaryTeamId',
          type: 'number'
        },
        "wyscoutId": {
          name: 'wyscoutId',
          type: 'number'
        },
        "wyscoutTeamId": {
          name: 'wyscoutTeamId',
          type: 'number'
        },
        "wyscoutSecondaryTeamId": {
          name: 'wyscoutSecondaryTeamId',
          type: 'number'
        },
        "gpexeId": {
          name: 'gpexeId',
          type: 'number'
        },
        "catapultId": {
          name: 'catapultId',
          type: 'any'
        },
        "fieldwizId": {
          name: 'fieldwizId',
          type: 'any'
        },
        "sonraId": {
          name: 'sonraId',
          type: 'any'
        },
        "statsportId": {
          name: 'statsportId',
          type: 'any'
        },
        "wimuId": {
          name: 'wimuId',
          type: 'string'
        },
        "name": {
          name: 'name',
          type: 'string'
        },
        "lastName": {
          name: 'lastName',
          type: 'string'
        },
        "displayName": {
          name: 'displayName',
          type: 'string'
        },
        "profilePhotoName": {
          name: 'profilePhotoName',
          type: 'string'
        },
        "profilePhotoUrl": {
          name: 'profilePhotoUrl',
          type: 'string'
        },
        "downloadUrl": {
          name: 'downloadUrl',
          type: 'string'
        },
        "gender": {
          name: 'gender',
          type: 'string'
        },
        "nationality": {
          name: 'nationality',
          type: 'string'
        },
        "altNationality": {
          name: 'altNationality',
          type: 'string'
        },
        "passport": {
          name: 'passport',
          type: 'string'
        },
        "altPassport": {
          name: 'altPassport',
          type: 'string'
        },
        "shoeSize": {
          name: 'shoeSize',
          type: 'string'
        },
        "captain": {
          name: 'captain',
          type: 'boolean'
        },
        "additionalInfo": {
          name: 'additionalInfo',
          type: 'string'
        },
        "inTeamFrom": {
          name: 'inTeamFrom',
          type: 'Date'
        },
        "inTeamTo": {
          name: 'inTeamTo',
          type: 'Date'
        },
        "facebook": {
          name: 'facebook',
          type: 'string'
        },
        "twitter": {
          name: 'twitter',
          type: 'string'
        },
        "instagram": {
          name: 'instagram',
          type: 'string'
        },
        "linkedin": {
          name: 'linkedin',
          type: 'string'
        },
        "snapchat": {
          name: 'snapchat',
          type: 'string'
        },
        "mobilePhone": {
          name: 'mobilePhone',
          type: 'string'
        },
        "otherMobile": {
          name: 'otherMobile',
          type: 'any'
        },
        "education": {
          name: 'education',
          type: 'string'
        },
        "school": {
          name: 'school',
          type: 'string'
        },
        "birthDate": {
          name: 'birthDate',
          type: 'Date'
        },
        "birthPlace": {
          name: 'birthPlace',
          type: 'string'
        },
        "weight": {
          name: 'weight',
          type: 'number'
        },
        "height": {
          name: 'height',
          type: 'number'
        },
        "position": {
          name: 'position',
          type: 'string'
        },
        "role1": {
          name: 'role1',
          type: 'Array&lt;any&gt;'
        },
        "position2": {
          name: 'position2',
          type: 'string'
        },
        "role2": {
          name: 'role2',
          type: 'Array&lt;any&gt;'
        },
        "position3": {
          name: 'position3',
          type: 'string'
        },
        "role3": {
          name: 'role3',
          type: 'Array&lt;any&gt;'
        },
        "foot": {
          name: 'foot',
          type: 'string'
        },
        "jersey": {
          name: 'jersey',
          type: 'number'
        },
        "valueField": {
          name: 'valueField',
          type: 'string'
        },
        "value": {
          name: 'value',
          type: 'number'
        },
        "transfermarktValue": {
          name: 'transfermarktValue',
          type: 'number'
        },
        "clubValue": {
          name: 'clubValue',
          type: 'number'
        },
        "agentValue": {
          name: 'agentValue',
          type: 'number'
        },
        "wage": {
          name: 'wage',
          type: 'number'
        },
        "contractStart": {
          name: 'contractStart',
          type: 'Date'
        },
        "contractEnd": {
          name: 'contractEnd',
          type: 'Date'
        },
        "phone": {
          name: 'phone',
          type: 'string'
        },
        "email": {
          name: 'email',
          type: 'string'
        },
        "address": {
          name: 'address',
          type: 'any'
        },
        "domicile": {
          name: 'domicile',
          type: 'any'
        },
        "botId": {
          name: 'botId',
          type: 'string'
        },
        "botMessageUrl": {
          name: 'botMessageUrl',
          type: 'string'
        },
        "anamnesys": {
          name: 'anamnesys',
          type: 'any'
        },
        "_thresholds": {
          name: '_thresholds',
          type: 'any'
        },
        "archived": {
          name: 'archived',
          type: 'boolean',
          default: false
        },
        "archivedDate": {
          name: 'archivedDate',
          type: 'Date'
        },
        "archivedMotivation": {
          name: 'archivedMotivation',
          type: 'string'
        },
        "currentStatus": {
          name: 'currentStatus',
          type: 'string'
        },
        "statusDetails": {
          name: 'statusDetails',
          type: 'any'
        },
        "movOnBall": {
          name: 'movOnBall',
          type: 'Array&lt;any&gt;'
        },
        "movOffBall": {
          name: 'movOffBall',
          type: 'Array&lt;any&gt;'
        },
        "passing": {
          name: 'passing',
          type: 'Array&lt;any&gt;'
        },
        "finishing": {
          name: 'finishing',
          type: 'Array&lt;any&gt;'
        },
        "defending": {
          name: 'defending',
          type: 'Array&lt;any&gt;'
        },
        "technique": {
          name: 'technique',
          type: 'Array&lt;any&gt;'
        },
        "documents": {
          name: 'documents',
          type: 'Array&lt;any&gt;'
        },
        "nationalityOrigin": {
          name: 'nationalityOrigin',
          type: 'string'
        },
        "fiscalIssue": {
          name: 'fiscalIssue',
          type: 'string'
        },
        "ageGroup": {
          name: 'ageGroup',
          type: 'string'
        },
        "biography": {
          name: 'biography',
          type: 'string'
        },
        "federalId": {
          name: 'federalId',
          type: 'string'
        },
        "federalMembership": {
          name: 'federalMembership',
          type: 'Array&lt;any&gt;'
        },
        "sportPassport": {
          name: 'sportPassport',
          type: 'Array&lt;any&gt;'
        },
        "maritalStatus": {
          name: 'maritalStatus',
          type: 'string'
        },
        "_statusHistory": {
          name: '_statusHistory',
          type: 'Array&lt;any&gt;'
        },
        "deleted": {
          name: 'deleted',
          type: 'boolean',
          default: false
        },
        "bankAccount": {
          name: 'bankAccount',
          type: 'any'
        },
        "firstFederalMembership": {
          name: 'firstFederalMembership',
          type: 'Date'
        },
        "transferNotesThreads": {
          name: 'transferNotesThreads',
          type: 'Array&lt;any&gt;'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "_thresholdsPlayer": {
          name: '_thresholdsPlayer',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_thresholdsTests": {
          name: '_thresholdsTests',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_thresholdsAttendances": {
          name: '_thresholdsAttendances',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_thresholdsMedical": {
          name: '_thresholdsMedical',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_thresholdsFinancial": {
          name: '_thresholdsFinancial',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_thresholdsAutoGenSettings": {
          name: '_thresholdsAutoGenSettings',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_chronicInjuries": {
          name: '_chronicInjuries',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "clubId": {
          name: 'clubId',
          type: 'any'
        },
        "_pastValues": {
          name: '_pastValues',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_pastTransfermarktValues": {
          name: '_pastTransfermarktValues',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_pastAgentValues": {
          name: '_pastAgentValues',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_pastClubValues": {
          name: '_pastClubValues',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_preventionExams": {
          name: '_preventionExams',
          type: 'Array&lt;any&gt;',
          default: <any>[]
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
        customerPlayer: {
          name: 'customerPlayer',
          type: 'CustomerPlayer',
          model: 'CustomerPlayer',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        sessionPlayerData: {
          name: 'sessionPlayerData',
          type: 'SessionPlayerData[]',
          model: 'SessionPlayerData',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        wellnesses: {
          name: 'wellnesses',
          type: 'Wellness[]',
          model: 'Wellness',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        playerStats: {
          name: 'playerStats',
          type: 'PlayerStat[]',
          model: 'PlayerStat',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        thresholdsPlayer: {
          name: 'thresholdsPlayer',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsPlayer',
          keyTo: 'id'
        },
        thresholdsTests: {
          name: 'thresholdsTests',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsTests',
          keyTo: 'id'
        },
        thresholdsAttendances: {
          name: 'thresholdsAttendances',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsAttendances',
          keyTo: 'id'
        },
        thresholdsMedical: {
          name: 'thresholdsMedical',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsMedical',
          keyTo: 'id'
        },
        thresholdsFinancial: {
          name: 'thresholdsFinancial',
          type: 'Threshold[]',
          model: 'Threshold',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsFinancial',
          keyTo: 'id'
        },
        thresholdsAutoGenSettings: {
          name: 'thresholdsAutoGenSettings',
          type: 'ThresholdAutoGenSetting[]',
          model: 'ThresholdAutoGenSetting',
          relationType: 'embedsMany',
                  keyFrom: '_thresholdsAutoGenSettings',
          keyTo: 'id'
        },
        goScores: {
          name: 'goScores',
          type: 'GOScore[]',
          model: 'GOScore',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        injuries: {
          name: 'injuries',
          type: 'Injury[]',
          model: 'Injury',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        chronicInjuries: {
          name: 'chronicInjuries',
          type: 'ChronicInjury[]',
          model: 'ChronicInjury',
          relationType: 'embedsMany',
                  keyFrom: '_chronicInjuries',
          keyTo: 'id'
        },
        club: {
          name: 'club',
          type: 'Club',
          model: 'Club',
          relationType: 'belongsTo',
                  keyFrom: 'clubId',
          keyTo: 'id'
        },
        transfer: {
          name: 'transfer',
          type: 'ClubTransfer',
          model: 'ClubTransfer',
          relationType: 'hasOne',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        pastValues: {
          name: 'pastValues',
          type: 'PlayerValue[]',
          model: 'PlayerValue',
          relationType: 'embedsMany',
                  keyFrom: '_pastValues',
          keyTo: 'id'
        },
        pastTransfermarktValues: {
          name: 'pastTransfermarktValues',
          type: 'PlayerValue[]',
          model: 'PlayerValue',
          relationType: 'embedsMany',
                  keyFrom: '_pastTransfermarktValues',
          keyTo: 'id'
        },
        pastAgentValues: {
          name: 'pastAgentValues',
          type: 'PlayerValue[]',
          model: 'PlayerValue',
          relationType: 'embedsMany',
                  keyFrom: '_pastAgentValues',
          keyTo: 'id'
        },
        pastClubValues: {
          name: 'pastClubValues',
          type: 'PlayerValue[]',
          model: 'PlayerValue',
          relationType: 'embedsMany',
                  keyFrom: '_pastClubValues',
          keyTo: 'id'
        },
        preventionExams: {
          name: 'preventionExams',
          type: 'PreventionExam[]',
          model: 'PreventionExam',
          relationType: 'embedsMany',
                  keyFrom: '_preventionExams',
          keyTo: 'id'
        },
        videos: {
          name: 'videos',
          type: 'VideoAsset[]',
          model: 'VideoAsset',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        descriptions: {
          name: 'descriptions',
          type: 'PlayerDescriptionEntry[]',
          model: 'PlayerDescriptionEntry',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        attributes: {
          name: 'attributes',
          type: 'PlayerAttributesEntry[]',
          model: 'PlayerAttributesEntry',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        gameReports: {
          name: 'gameReports',
          type: 'PlayerGameReport[]',
          model: 'PlayerGameReport',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        trainingReports: {
          name: 'trainingReports',
          type: 'PlayerTrainingReport[]',
          model: 'PlayerTrainingReport',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        medicalTreatments: {
          name: 'medicalTreatments',
          type: 'MedicalTreatment[]',
          model: 'MedicalTreatment',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'playerId'
        },
        costItems: {
          name: 'costItems',
          type: 'PersonCostItem[]',
          model: 'PersonCostItem',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        employmentContracts: {
          name: 'employmentContracts',
          type: 'EmploymentContract[]',
          model: 'EmploymentContract',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
        transferContracts: {
          name: 'transferContracts',
          type: 'TransferContract[]',
          model: 'TransferContract',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'personId'
        },
      }
    }
  }
}
