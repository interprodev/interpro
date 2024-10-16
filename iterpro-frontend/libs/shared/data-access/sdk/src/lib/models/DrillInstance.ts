/* tslint:disable */
import {
  Event,
  Player,
  Staff
} from '../index';

declare var Object: any;
export interface DrillInstanceInterface {
  "id"?: string;
  "theme"?: string;
  "name"?: string;
  "sets"?: number;
  "reps"?: string;
  "count"?: number;
  "rest"?: string;
  "duration"?: number;
  "videoUrl"?: string;
  "drillId"?: string;
  "index"?: number;
  "letter"?: string;
  "notes"?: string;
  "eventId"?: any;
  "participantsIds"?: Array<any>;
  "sharedPlayerIds"?: Array<any>;
  "sharedStaffIds"?: Array<any>;
  event?: Event;
  participants?: Player[];
  sharedPlayers?: Player[];
  sharedStaffs?: Staff[];
}

export class DrillInstance implements DrillInstanceInterface {
  "id": string;
  "theme": string;
  "name": string;
  "sets": number;
  "reps": string;
  "count": number;
  "rest": string;
  "duration": number;
  "videoUrl": string;
  "drillId": string;
  "index": number;
  "letter": string;
  "notes": string;
  "eventId": any;
  "participantsIds": Array<any>;
  "sharedPlayerIds": Array<any>;
  "sharedStaffIds": Array<any>;
  event: Event;
  participants: Player[];
  sharedPlayers: Player[];
  sharedStaffs: Staff[];
  constructor(data?: DrillInstanceInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `DrillInstance`.
   */
  public static getModelName() {
    return "DrillInstance";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of DrillInstance for dynamic purposes.
  **/
  public static factory(data: DrillInstanceInterface): DrillInstance{
    return new DrillInstance(data);
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
      name: 'DrillInstance',
      plural: 'DrillInstances',
      path: 'DrillInstances',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "theme": {
          name: 'theme',
          type: 'string'
        },
        "name": {
          name: 'name',
          type: 'string'
        },
        "sets": {
          name: 'sets',
          type: 'number'
        },
        "reps": {
          name: 'reps',
          type: 'string'
        },
        "count": {
          name: 'count',
          type: 'number'
        },
        "rest": {
          name: 'rest',
          type: 'string'
        },
        "duration": {
          name: 'duration',
          type: 'number'
        },
        "videoUrl": {
          name: 'videoUrl',
          type: 'string'
        },
        "drillId": {
          name: 'drillId',
          type: 'string'
        },
        "index": {
          name: 'index',
          type: 'number'
        },
        "letter": {
          name: 'letter',
          type: 'string'
        },
        "notes": {
          name: 'notes',
          type: 'string'
        },
        "eventId": {
          name: 'eventId',
          type: 'any'
        },
        "participantsIds": {
          name: 'participantsIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "sharedPlayerIds": {
          name: 'sharedPlayerIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "sharedStaffIds": {
          name: 'sharedStaffIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
      },
      relations: {
        event: {
          name: 'event',
          type: 'Event',
          model: 'Event',
          relationType: 'belongsTo',
                  keyFrom: 'eventId',
          keyTo: 'id'
        },
        participants: {
          name: 'participants',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'participantsIds',
          keyTo: 'id'
        },
        sharedPlayers: {
          name: 'sharedPlayers',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'sharedPlayerIds',
          keyTo: 'id'
        },
        sharedStaffs: {
          name: 'sharedStaffs',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'referencesMany',
                  keyFrom: 'sharedStaffIds',
          keyTo: 'id'
        },
      }
    }
  }
}
