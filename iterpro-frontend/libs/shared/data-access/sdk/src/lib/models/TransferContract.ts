/* tslint:disable */
import {
  Attachment,
  AgentContract,
  Bonus,
  BasicWage,
  TransferClause,
  LoanOption
} from '../index';

declare var Object: any;
export interface TransferContractInterface {
  "typeTransfer"?: string;
  "on": Date;
  "endDate"?: Date;
  "stipulationDate"?: Date;
  "itcDate"?: Date;
  "club"?: string;
  "homeTransfer"?: boolean;
  "amount"?: number;
  "grossAmount"?: number;
  "installments"?: Array<any>;
  "amountAsset"?: boolean;
  "mechanismSolidarity"?: number;
  "mechanismSolidarityAsset"?: boolean;
  "mechanismSolidarityType"?: string;
  "within"?: Date;
  "withinDays"?: number;
  "withinMode"?: string;
  "options"?: any;
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
  "personId"?: any;
  "personType"?: string;
  "renewContractId"?: any;
  attachments?: Attachment[];
  person?: any;
  agentContracts?: AgentContract[];
  renewContract?: TransferContract;
  bonuses?: Bonus[];
  valorization?: BasicWage[];
  sellOnFee?: TransferClause[];
  buyBack?: TransferClause[];
  loanOption?: LoanOption[];
}

export class TransferContract implements TransferContractInterface {
  "typeTransfer": string;
  "on": Date;
  "endDate": Date;
  "stipulationDate": Date;
  "itcDate": Date;
  "club": string;
  "homeTransfer": boolean;
  "amount": number;
  "grossAmount": number;
  "installments": Array<any>;
  "amountAsset": boolean;
  "mechanismSolidarity": number;
  "mechanismSolidarityAsset": boolean;
  "mechanismSolidarityType": string;
  "within": Date;
  "withinDays": number;
  "withinMode": string;
  "options": any;
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
  "personId": any;
  "personType": string;
  "renewContractId": any;
  attachments: Attachment[];
  person: any;
  agentContracts: AgentContract[];
  renewContract: TransferContract;
  bonuses: Bonus[];
  valorization: BasicWage[];
  sellOnFee: TransferClause[];
  buyBack: TransferClause[];
  loanOption: LoanOption[];
  constructor(data?: TransferContractInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TransferContract`.
   */
  public static getModelName() {
    return "TransferContract";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TransferContract for dynamic purposes.
  **/
  public static factory(data: TransferContractInterface): TransferContract{
    return new TransferContract(data);
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
      name: 'TransferContract',
      plural: 'TransferContracts',
      path: 'TransferContracts',
      idName: 'id',
      properties: {
        "typeTransfer": {
          name: 'typeTransfer',
          type: 'string'
        },
        "on": {
          name: 'on',
          type: 'Date'
        },
        "endDate": {
          name: 'endDate',
          type: 'Date'
        },
        "stipulationDate": {
          name: 'stipulationDate',
          type: 'Date'
        },
        "itcDate": {
          name: 'itcDate',
          type: 'Date'
        },
        "club": {
          name: 'club',
          type: 'string'
        },
        "homeTransfer": {
          name: 'homeTransfer',
          type: 'boolean',
          default: false
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
          type: 'Array&lt;any&gt;'
        },
        "amountAsset": {
          name: 'amountAsset',
          type: 'boolean',
          default: true
        },
        "mechanismSolidarity": {
          name: 'mechanismSolidarity',
          type: 'number'
        },
        "mechanismSolidarityAsset": {
          name: 'mechanismSolidarityAsset',
          type: 'boolean',
          default: true
        },
        "mechanismSolidarityType": {
          name: 'mechanismSolidarityType',
          type: 'string',
          default: 'add'
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
          type: 'string'
        },
        "options": {
          name: 'options',
          type: 'any'
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
          type: 'TransferContract',
          model: 'TransferContract',
          relationType: 'belongsTo',
                  keyFrom: 'renewContractId',
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
        valorization: {
          name: 'valorization',
          type: 'BasicWage[]',
          model: 'BasicWage',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        sellOnFee: {
          name: 'sellOnFee',
          type: 'TransferClause[]',
          model: 'TransferClause',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        buyBack: {
          name: 'buyBack',
          type: 'TransferClause[]',
          model: 'TransferClause',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
        loanOption: {
          name: 'loanOption',
          type: 'LoanOption[]',
          model: 'LoanOption',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'contractId'
        },
      }
    }
  }
}
