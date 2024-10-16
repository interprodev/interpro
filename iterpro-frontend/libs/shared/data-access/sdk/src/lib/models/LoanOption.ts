/* tslint:disable */
import {
  TransferContract,
  Agent,
  ContractOptionCondition
} from '../index';

declare var Object: any;
export interface LoanOptionInterface {
  "dateFrom"?: Date;
  "dateTo"?: Date;
  "option"?: string;
  "action"?: string;
  "percentage"?: boolean;
  "conditioned"?: boolean;
  "counterOption"?: any;
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
  "personId"?: any;
  "personType"?: string;
  "agentId"?: any;
  "conditions"?: Array<any>;
  contract?: TransferContract;
  person?: any;
  agent?: Agent;
  _conditions?: ContractOptionCondition[];
}

export class LoanOption implements LoanOptionInterface {
  "dateFrom": Date;
  "dateTo": Date;
  "option": string;
  "action": string;
  "percentage": boolean;
  "conditioned": boolean;
  "counterOption": any;
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
  "personId": any;
  "personType": string;
  "agentId": any;
  "conditions": Array<any>;
  contract: TransferContract;
  person: any;
  agent: Agent;
  _conditions: ContractOptionCondition[];
  constructor(data?: LoanOptionInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `LoanOption`.
   */
  public static getModelName() {
    return "LoanOption";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of LoanOption for dynamic purposes.
  **/
  public static factory(data: LoanOptionInterface): LoanOption{
    return new LoanOption(data);
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
      name: 'LoanOption',
      plural: 'LoanOptions',
      path: 'LoanOptions',
      idName: 'id',
      properties: {
        "dateFrom": {
          name: 'dateFrom',
          type: 'Date'
        },
        "dateTo": {
          name: 'dateTo',
          type: 'Date'
        },
        "option": {
          name: 'option',
          type: 'string'
        },
        "action": {
          name: 'action',
          type: 'string'
        },
        "percentage": {
          name: 'percentage',
          type: 'boolean',
          default: false
        },
        "conditioned": {
          name: 'conditioned',
          type: 'boolean',
          default: false
        },
        "counterOption": {
          name: 'counterOption',
          type: 'any'
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
        "conditions": {
          name: 'conditions',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        contract: {
          name: 'contract',
          type: 'TransferContract',
          model: 'TransferContract',
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
