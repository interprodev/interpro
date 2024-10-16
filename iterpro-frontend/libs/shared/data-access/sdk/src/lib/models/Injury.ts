/* tslint:disable */
import {
  Player,
  Event,
  InjuryAssessment,
  InjuryExam,
  MedicalTreatment
} from '../index';

declare var Object: any;
export interface InjuryInterface {
  "createdBy"?: string;
  "issue"?: string;
  "date": Date;
  "endDate"?: Date;
  "admissionDate"?: Date;
  "system"?: any;
  "location": string;
  "anatomicalDetails"?: any;
  "type"?: any;
  "reinjury"?: boolean;
  "category"?: string;
  "contact"?: boolean;
  "mechanism"?: string;
  "occurrence"?: string;
  "severity"?: string;
  "expectedReturn"?: Date;
  "diagnosis"?: string;
  "notes"?: string;
  "surgery"?: boolean;
  "surgeryNotes"?: string;
  "treatInstruction"?: string;
  "currentStatus"?: string;
  "chronicInjuryId"?: string;
  "statusHistory"?: Array<any>;
  "osics"?: string;
  "pitch"?: string;
  "boots"?: string;
  "id"?: any;
  "playerId"?: any;
  "eventId"?: any;
  "_injuryAssessments"?: Array<any>;
  "_injuryExams"?: Array<any>;
  player?: Player;
  event?: Event;
  injuryAssessments?: InjuryAssessment[];
  injuryExams?: InjuryExam[];
  treatments?: MedicalTreatment[];
}

export class Injury implements InjuryInterface {
  "createdBy": string;
  "issue": string;
  "date": Date;
  "endDate": Date;
  "admissionDate": Date;
  "system": any;
  "location": string;
  "anatomicalDetails": any;
  "type": any;
  "reinjury": boolean;
  "category": string;
  "contact": boolean;
  "mechanism": string;
  "occurrence": string;
  "severity": string;
  "expectedReturn": Date;
  "diagnosis": string;
  "notes": string;
  "surgery": boolean;
  "surgeryNotes": string;
  "treatInstruction": string;
  "currentStatus": string;
  "chronicInjuryId": string;
  "statusHistory": Array<any>;
  "osics": string;
  "pitch": string;
  "boots": string;
  "id": any;
  "playerId": any;
  "eventId": any;
  "_injuryAssessments": Array<any>;
  "_injuryExams": Array<any>;
  player: Player;
  event: Event;
  injuryAssessments: InjuryAssessment[];
  injuryExams: InjuryExam[];
  treatments: MedicalTreatment[];
  constructor(data?: InjuryInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Injury`.
   */
  public static getModelName() {
    return "Injury";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Injury for dynamic purposes.
  **/
  public static factory(data: InjuryInterface): Injury{
    return new Injury(data);
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
      name: 'Injury',
      plural: 'Injuries',
      path: 'Injuries',
      idName: 'id',
      properties: {
        "createdBy": {
          name: 'createdBy',
          type: 'string'
        },
        "issue": {
          name: 'issue',
          type: 'string'
        },
        "date": {
          name: 'date',
          type: 'Date'
        },
        "endDate": {
          name: 'endDate',
          type: 'Date',
          default: new Date(0)
        },
        "admissionDate": {
          name: 'admissionDate',
          type: 'Date'
        },
        "system": {
          name: 'system',
          type: 'any'
        },
        "location": {
          name: 'location',
          type: 'string'
        },
        "anatomicalDetails": {
          name: 'anatomicalDetails',
          type: 'any'
        },
        "type": {
          name: 'type',
          type: 'any'
        },
        "reinjury": {
          name: 'reinjury',
          type: 'boolean',
          default: false
        },
        "category": {
          name: 'category',
          type: 'string'
        },
        "contact": {
          name: 'contact',
          type: 'boolean',
          default: false
        },
        "mechanism": {
          name: 'mechanism',
          type: 'string'
        },
        "occurrence": {
          name: 'occurrence',
          type: 'string'
        },
        "severity": {
          name: 'severity',
          type: 'string'
        },
        "expectedReturn": {
          name: 'expectedReturn',
          type: 'Date'
        },
        "diagnosis": {
          name: 'diagnosis',
          type: 'string'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "surgery": {
          name: 'surgery',
          type: 'boolean'
        },
        "surgeryNotes": {
          name: 'surgeryNotes',
          type: 'string'
        },
        "treatInstruction": {
          name: 'treatInstruction',
          type: 'string'
        },
        "currentStatus": {
          name: 'currentStatus',
          type: 'string'
        },
        "chronicInjuryId": {
          name: 'chronicInjuryId',
          type: 'string'
        },
        "statusHistory": {
          name: 'statusHistory',
          type: 'Array&lt;any&gt;'
        },
        "osics": {
          name: 'osics',
          type: 'string'
        },
        "pitch": {
          name: 'pitch',
          type: 'string'
        },
        "boots": {
          name: 'boots',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "_injuryAssessments": {
          name: '_injuryAssessments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_injuryExams": {
          name: '_injuryExams',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        player: {
          name: 'player',
          type: 'Player',
          model: 'Player',
          relationType: 'belongsTo',
                  keyFrom: 'playerId',
          keyTo: 'id'
        },
        event: {
          name: 'event',
          type: 'Event',
          model: 'Event',
          relationType: 'belongsTo',
                  keyFrom: 'eventId',
          keyTo: 'id'
        },
        injuryAssessments: {
          name: 'injuryAssessments',
          type: 'InjuryAssessment[]',
          model: 'InjuryAssessment',
          relationType: 'embedsMany',
                  keyFrom: '_injuryAssessments',
          keyTo: 'id'
        },
        injuryExams: {
          name: 'injuryExams',
          type: 'InjuryExam[]',
          model: 'InjuryExam',
          relationType: 'embedsMany',
                  keyFrom: '_injuryExams',
          keyTo: 'id'
        },
        treatments: {
          name: 'treatments',
          type: 'MedicalTreatment[]',
          model: 'MedicalTreatment',
          relationType: 'hasMany',
                  keyFrom: 'id',
          keyTo: 'injuryId'
        },
      }
    }
  }
}
