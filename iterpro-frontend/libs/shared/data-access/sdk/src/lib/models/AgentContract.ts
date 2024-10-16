/* tslint:disable */
import {
  Attachment,
  Agent,
  Bonus,
  BasicWage
} from '../index';

declare var Object: any;
export interface AgentContractInterface {
  "conflict"?: boolean;
  "number"?: string;
  "status"?: boolean;
  "validated"?: boolean;
  "currency"?: string;
  "personStatus"?: string;
  "signatureDate"?: Date;
  "extension"?: boolean;
  "extensionNotes"?: string;
  "additionalClauses"?: Array<any>;
  "contractCloudUrl"?: string;
  "contractUrl"?: string;
  "contractPublicId"?: string;
  "contractFilename"?: string;
  "bonusCap"?: number;
  "notes"?: string;
  "renew"?: boolean;
  "changeHistory"?: Array<any>;
  "valid"?: boolean;
  "id"?: any;
  "_attachments"?: Array<any>;
  "contractId"?: any;
  "contractType"?: string;
  "agentId"?: any;
  attachments?: Attachment[];
  contract?: any;
  agent?: Agent;
  bonuses?: Bonus[];
  fee?: BasicWage[];
}

export class AgentContract implements AgentContractInterface {
  "conflict": boolean;
  "number": string;
  "status": boolean;
  "validated": boolean;
  "currency": string;
  "personStatus": string;
  "signatureDate": Date;
  "extension": boolean;
  "extensionNotes": string;
  "additionalClauses": Array<any>;
  "contractCloudUrl": string;
  "contractUrl": string;
  "contractPublicId": string;
  "contractFilename": string;
  "bonusCap": number;
  "notes": string;
  "renew": boolean;
  "changeHistory": Array<any>;
  "valid": boolean;
  "id": any;
  "_attachments": Array<any>;
  "contractId": any;
  "contractType": string;
  "agentId": any;
  attachments: Attachment[];
  contract: any;
  agent: Agent;
  bonuses: Bonus[];
  fee: BasicWage[];
  constructor(data?: AgentContractInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `AgentContract`.
   */
  public static getModelName() {
    return "AgentContract";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of AgentContract for dynamic purposes.
  **/
  public static factory(data: AgentContractInterface): AgentContract{
    return new AgentContract(data);
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
      name: 'AgentContract',
      plural: 'AgentContracts',
      path: 'AgentContracts',
      idName: 'id',
      properties: {
        "conflict": {
          name: 'conflict',
          type: 'boolean',
          default: false
        },
        "number": {
          name: 'number',
          type: 'string'
        },
        "status": {
          name: 'status',
          type: 'boolean',
          default: true
        },
        "validated": {
          name: 'validated',
          type: 'boolean',
          default: false
        },
        "currency": {
          name: 'currency',
          type: 'string'
        },
        "personStatus": {
          name: 'personStatus',
          type: 'string'
        },
        "signatureDate": {
          name: 'signatureDate',
          type: 'Date'
        },
        "extension": {
          name: 'extension',
          type: 'boolean',
          default: false
        },
        "extensionNotes": {
          name: 'extensionNotes',
          type: 'string'
        },
        "additionalClauses": {
          name: 'additionalClauses',
          type: 'Array&lt;any&gt;'
        },
        "contractCloudUrl": {
          name: 'contractCloudUrl',
          type: 'string'
        },
        "contractUrl": {
          name: 'contractUrl',
          type: 'string'
        },
        "contractPublicId": {
          name: 'contractPublicId',
          type: 'string'
        },
        "contractFilename": {
          name: 'contractFilename',
          type: 'string'
        },
        "bonusCap": {
          name: 'bonusCap',
          type: 'number'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "renew": {
          name: 'renew',
          type: 'boolean',
          default: false
        },
        "changeHistory": {
          name: 'changeHistory',
          type: 'Array&lt;any&gt;'
        },
        "valid": {
          name: 'valid',
          type: 'boolean'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "_attachments": {
          name: '_attachments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "contractId": {
          name: 'contractId',
          type: 'any'
        },
        "contractType": {
          name: 'contractType',
          type: 'string'
        },
        "agentId": {
          name: 'agentId',
          type: 'any'
        },
      },
      relations: {
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
        contract: {
          name: 'contract',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'contractId',
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
        bonuses: {
          name: 'bonuses',
          type: 'Bonus[]',
          model: 'Bonus',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        fee: {
          name: 'fee',
          type: 'BasicWage[]',
          model: 'BasicWage',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
      }
    }
  }
}
