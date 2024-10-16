/* tslint:disable */
import {
  Attachment,
  AgentContract,
  TransferContract,
  Bonus,
  BasicWage
} from '../index';

declare var Object: any;
export interface EmploymentContractInterface {
  "dateFrom": Date;
  "dateTo": Date;
  "additionalClauses"?: Array<any>;
  "benefits"?: Array<any>;
  "options"?: Array<any>;
  "commercialRights"?: Array<any>;
  "termination"?: Array<any>;
  "buyout"?: Array<any>;
  "insurance"?: any;
  "inward"?: string;
  "outward"?: string;
  "number"?: string;
  "status"?: boolean;
  "validated"?: boolean;
  "currency"?: string;
  "personStatus"?: string;
  "signatureDate"?: Date;
  "extension"?: boolean;
  "extensionNotes"?: string;
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
  "personId"?: any;
  "personType"?: string;
  "renewContractId"?: any;
  "transferContractId"?: any;
  attachments?: Attachment[];
  person?: any;
  agentContracts?: AgentContract[];
  renewContract?: EmploymentContract;
  transferContract?: TransferContract;
  bonuses?: Bonus[];
  basicWages?: BasicWage[];
  privateWriting?: BasicWage[];
  contributions?: BasicWage[];
}

export class EmploymentContract implements EmploymentContractInterface {
  "dateFrom": Date;
  "dateTo": Date;
  "additionalClauses": Array<any>;
  "benefits": Array<any>;
  "options": Array<any>;
  "commercialRights": Array<any>;
  "termination": Array<any>;
  "buyout": Array<any>;
  "insurance": any;
  "inward": string;
  "outward": string;
  "number": string;
  "status": boolean;
  "validated": boolean;
  "currency": string;
  "personStatus": string;
  "signatureDate": Date;
  "extension": boolean;
  "extensionNotes": string;
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
  "personId": any;
  "personType": string;
  "renewContractId": any;
  "transferContractId": any;
  attachments: Attachment[];
  person: any;
  agentContracts: AgentContract[];
  renewContract: EmploymentContract;
  transferContract: TransferContract;
  bonuses: Bonus[];
  basicWages: BasicWage[];
  privateWriting: BasicWage[];
  contributions: BasicWage[];
  constructor(data?: EmploymentContractInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `EmploymentContract`.
   */
  public static getModelName() {
    return "EmploymentContract";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of EmploymentContract for dynamic purposes.
  **/
  public static factory(data: EmploymentContractInterface): EmploymentContract{
    return new EmploymentContract(data);
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
      name: 'EmploymentContract',
      plural: 'EmploymentContracts',
      path: 'EmploymentContracts',
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
        "additionalClauses": {
          name: 'additionalClauses',
          type: 'Array&lt;any&gt;'
        },
        "benefits": {
          name: 'benefits',
          type: 'Array&lt;any&gt;'
        },
        "options": {
          name: 'options',
          type: 'Array&lt;any&gt;'
        },
        "commercialRights": {
          name: 'commercialRights',
          type: 'Array&lt;any&gt;'
        },
        "termination": {
          name: 'termination',
          type: 'Array&lt;any&gt;'
        },
        "buyout": {
          name: 'buyout',
          type: 'Array&lt;any&gt;'
        },
        "insurance": {
          name: 'insurance',
          type: 'any'
        },
        "inward": {
          name: 'inward',
          type: 'string'
        },
        "outward": {
          name: 'outward',
          type: 'string'
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
        "personId": {
          name: 'personId',
          type: 'any'
        },
        "personType": {
          name: 'personType',
          type: 'string'
        },
        "renewContractId": {
          name: 'renewContractId',
          type: 'any'
        },
        "transferContractId": {
          name: 'transferContractId',
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
        person: {
          name: 'person',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'personId',
          keyTo: 'id'
        },
        agentContracts: {
          name: 'agentContracts',
          type: 'AgentContract[]',
          model: 'AgentContract',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        renewContract: {
          name: 'renewContract',
          type: 'EmploymentContract',
          model: 'EmploymentContract',
          relationType: 'belongsTo',
                  keyFrom: 'renewContractId',
          keyTo: 'id'
        },
        transferContract: {
          name: 'transferContract',
          type: 'TransferContract',
          model: 'TransferContract',
          relationType: 'belongsTo',
                  keyFrom: 'transferContractId',
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
        basicWages: {
          name: 'basicWages',
          type: 'BasicWage[]',
          model: 'BasicWage',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        privateWriting: {
          name: 'privateWriting',
          type: 'BasicWage[]',
          model: 'BasicWage',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        contributions: {
          name: 'contributions',
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
