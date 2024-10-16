/* tslint:disable */

declare var Object: any;
export interface ContractOptionConditionInterface {
  "_id"?: string;
  "type": string;
  "action"?: string;
  "count"?: number;
  "count2"?: number;
  "goal"?: string;
  "team"?: string;
  "custom"?: string;
  "phases"?: any;
  "competitions"?: any;
  "seasons"?: any;
  "startDate"?: Date;
  "untilDate"?: Date;
  "membershipDate"?: Date;
  "soldDate"?: Date;
  "soldAmount"?: number;
  "condition"?: string;
  "matchId"?: string;
  "seasonsRelationFlag"?: string;
  "competitionsRelationFlag"?: string;
  "bonusCap"?: number;
  "progress"?: any;
}

export class ContractOptionCondition implements ContractOptionConditionInterface {
  "_id": string;
  "type": string;
  "action": string;
  "count": number;
  "count2": number;
  "goal": string;
  "team": string;
  "custom": string;
  "phases": any;
  "competitions": any;
  "seasons": any;
  "startDate": Date;
  "untilDate": Date;
  "membershipDate": Date;
  "soldDate": Date;
  "soldAmount": number;
  "condition": string;
  "matchId": string;
  "seasonsRelationFlag": string;
  "competitionsRelationFlag": string;
  "bonusCap": number;
  "progress": any;
  constructor(data?: ContractOptionConditionInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ContractOptionCondition`.
   */
  public static getModelName() {
    return "ContractOptionCondition";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ContractOptionCondition for dynamic purposes.
  **/
  public static factory(data: ContractOptionConditionInterface): ContractOptionCondition{
    return new ContractOptionCondition(data);
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
      name: 'ContractOptionCondition',
      plural: 'ContractOptionConditions',
      path: 'ContractOptionConditions',
      idName: '_id',
      properties: {
        "_id": {
          name: '_id',
          type: 'string'
        },
        "type": {
          name: 'type',
          type: 'string'
        },
        "action": {
          name: 'action',
          type: 'string'
        },
        "count": {
          name: 'count',
          type: 'number'
        },
        "count2": {
          name: 'count2',
          type: 'number'
        },
        "goal": {
          name: 'goal',
          type: 'string'
        },
        "team": {
          name: 'team',
          type: 'string'
        },
        "custom": {
          name: 'custom',
          type: 'string'
        },
        "phases": {
          name: 'phases',
          type: 'any'
        },
        "competitions": {
          name: 'competitions',
          type: 'any'
        },
        "seasons": {
          name: 'seasons',
          type: 'any'
        },
        "startDate": {
          name: 'startDate',
          type: 'Date'
        },
        "untilDate": {
          name: 'untilDate',
          type: 'Date'
        },
        "membershipDate": {
          name: 'membershipDate',
          type: 'Date'
        },
        "soldDate": {
          name: 'soldDate',
          type: 'Date'
        },
        "soldAmount": {
          name: 'soldAmount',
          type: 'number'
        },
        "condition": {
          name: 'condition',
          type: 'string'
        },
        "matchId": {
          name: 'matchId',
          type: 'string'
        },
        "seasonsRelationFlag": {
          name: 'seasonsRelationFlag',
          type: 'string',
          default: 'and'
        },
        "competitionsRelationFlag": {
          name: 'competitionsRelationFlag',
          type: 'string',
          default: 'and'
        },
        "bonusCap": {
          name: 'bonusCap',
          type: 'number'
        },
        "progress": {
          name: 'progress',
          type: 'any',
          default: <any>null
        },
      },
      relations: {
      }
    }
  }
}
