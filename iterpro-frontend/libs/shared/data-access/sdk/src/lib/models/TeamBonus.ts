/* tslint:disable */
import {
  Agent,
  Match,
  Team,
  ClubSeason,
  ContractOptionCondition
} from '../index';

declare var Object: any;
export interface TeamBonusInterface {
  "people"?: Array<any>;
  "total"?: number;
  "dueDate"?: Date;
  "type": string;
  "transferType"?: string;
  "amount": number;
  "grossAmount"?: number;
  "installments"?: Array<any>;
  "asset"?: boolean;
  "mechanismSolidarity"?: number;
  "mechanismSolidarityType"?: string;
  "reachable"?: boolean;
  "reached"?: boolean;
  "confirmed"?: boolean;
  "paid"?: boolean;
  "achievedDate"?: Date;
  "confirmedDate"?: Date;
  "paidDate"?: Date;
  "within"?: Date;
  "withinDays"?: number;
  "withinMode"?: string;
  "reachedCustomerId"?: string;
  "confirmedCustomerId"?: string;
  "paidCustomerId"?: string;
  "conditionRelationFlag"?: string;
  "manualEvaluation"?: boolean;
  "notes"?: string;
  "progress"?: any;
  "id"?: any;
  "contractId"?: any;
  "contractType"?: string;
  "personId"?: any;
  "personType"?: string;
  "agentId"?: any;
  "matchId"?: any;
  "teamId"?: any;
  "seasonId"?: any;
  "clubSeasonId"?: any;
  "conditions"?: Array<any>;
  contract?: any;
  person?: any;
  agent?: Agent;
  match?: Match;
  team?: Team;
  clubSeason?: ClubSeason;
  _conditions?: ContractOptionCondition[];
}

export class TeamBonus implements TeamBonusInterface {
  "people": Array<any>;
  "total": number;
  "dueDate": Date;
  "type": string;
  "transferType": string;
  "amount": number;
  "grossAmount": number;
  "installments": Array<any>;
  "asset": boolean;
  "mechanismSolidarity": number;
  "mechanismSolidarityType": string;
  "reachable": boolean;
  "reached": boolean;
  "confirmed": boolean;
  "paid": boolean;
  "achievedDate": Date;
  "confirmedDate": Date;
  "paidDate": Date;
  "within": Date;
  "withinDays": number;
  "withinMode": string;
  "reachedCustomerId": string;
  "confirmedCustomerId": string;
  "paidCustomerId": string;
  "conditionRelationFlag": string;
  "manualEvaluation": boolean;
  "notes": string;
  "progress": any;
  "id": any;
  "contractId": any;
  "contractType": string;
  "personId": any;
  "personType": string;
  "agentId": any;
  "matchId": any;
  "teamId": any;
  "seasonId": any;
  "clubSeasonId": any;
  "conditions": Array<any>;
  contract: any;
  person: any;
  agent: Agent;
  match: Match;
  team: Team;
  clubSeason: ClubSeason;
  _conditions: ContractOptionCondition[];
  constructor(data?: TeamBonusInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TeamBonus`.
   */
  public static getModelName() {
    return "TeamBonus";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TeamBonus for dynamic purposes.
  **/
  public static factory(data: TeamBonusInterface): TeamBonus{
    return new TeamBonus(data);
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
      name: 'TeamBonus',
      plural: 'TeamBonuses',
      path: 'TeamBonuses',
      idName: 'id',
      properties: {
        "people": {
          name: 'people',
          type: 'Array&lt;any&gt;'
        },
        "total": {
          name: 'total',
          type: 'number'
        },
        "dueDate": {
          name: 'dueDate',
          type: 'Date'
        },
        "type": {
          name: 'type',
          type: 'string'
        },
        "transferType": {
          name: 'transferType',
          type: 'string'
        },
        "amount": {
          name: 'amount',
          type: 'number'
        },
        "grossAmount": {
          name: 'grossAmount',
          type: 'number'
        },
        "installments": {
          name: 'installments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "asset": {
          name: 'asset',
          type: 'boolean',
          default: false
        },
        "mechanismSolidarity": {
          name: 'mechanismSolidarity',
          type: 'number'
        },
        "mechanismSolidarityType": {
          name: 'mechanismSolidarityType',
          type: 'string',
          default: 'add'
        },
        "reachable": {
          name: 'reachable',
          type: 'boolean',
          default: true
        },
        "reached": {
          name: 'reached',
          type: 'boolean',
          default: false
        },
        "confirmed": {
          name: 'confirmed',
          type: 'boolean',
          default: false
        },
        "paid": {
          name: 'paid',
          type: 'boolean',
          default: false
        },
        "achievedDate": {
          name: 'achievedDate',
          type: 'Date'
        },
        "confirmedDate": {
          name: 'confirmedDate',
          type: 'Date'
        },
        "paidDate": {
          name: 'paidDate',
          type: 'Date'
        },
        "within": {
          name: 'within',
          type: 'Date'
        },
        "withinDays": {
          name: 'withinDays',
          type: 'number'
        },
        "withinMode": {
          name: 'withinMode',
          type: 'string',
          default: 'days'
        },
        "reachedCustomerId": {
          name: 'reachedCustomerId',
          type: 'string'
        },
        "confirmedCustomerId": {
          name: 'confirmedCustomerId',
          type: 'string'
        },
        "paidCustomerId": {
          name: 'paidCustomerId',
          type: 'string'
        },
        "conditionRelationFlag": {
          name: 'conditionRelationFlag',
          type: 'string',
          default: 'and'
        },
        "manualEvaluation": {
          name: 'manualEvaluation',
          type: 'boolean',
          default: false
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "progress": {
          name: 'progress',
          type: 'any',
          default: <any>null
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "contractId": {
          name: 'contractId',
          type: 'any'
        },
        "contractType": {
          name: 'contractType',
          type: 'string'
        },
        "personId": {
          name: 'personId',
          type: 'any'
        },
        "personType": {
          name: 'personType',
          type: 'string'
        },
        "agentId": {
          name: 'agentId',
          type: 'any'
        },
        "matchId": {
          name: 'matchId',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "seasonId": {
          name: 'seasonId',
          type: 'any'
        },
        "clubSeasonId": {
          name: 'clubSeasonId',
          type: 'any'
        },
        "conditions": {
          name: 'conditions',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        contract: {
          name: 'contract',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'contractId',
          keyTo: 'id'
        },
        person: {
          name: 'person',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'personId',
          keyTo: 'id'
        },
        agent: {
          name: 'agent',
          type: 'Agent',
          model: 'Agent',
          relationType: 'belongsTo',
                  keyFrom: 'agentId',
          keyTo: 'id'
        },
        match: {
          name: 'match',
          type: 'Match',
          model: 'Match',
          relationType: 'belongsTo',
                  keyFrom: 'matchId',
          keyTo: 'id'
        },
        team: {
          name: 'team',
          type: 'Team',
          model: 'Team',
          relationType: 'belongsTo',
                  keyFrom: 'teamId',
          keyTo: 'id'
        },
        clubSeason: {
          name: 'clubSeason',
          type: 'ClubSeason',
          model: 'ClubSeason',
          relationType: 'belongsTo',
                  keyFrom: 'seasonId',
          keyTo: 'id'
        },
        _conditions: {
          name: '_conditions',
          type: 'ContractOptionCondition[]',
          model: 'ContractOptionCondition',
          relationType: 'embedsMany',
                  keyFrom: 'conditions',
          keyTo: '_id'
        },
      }
    }
  }
}
