/* tslint:disable */
import {
  Player,
  Staff,
  Attachment,
  Team
} from '../index';

declare var Object: any;
export interface VideoAssetInterface {
  "category"?: string;
  "title"?: string;
  "subtitle"?: string;
  "tags"?: any;
  "notesThreads"?: Array<any>;
  "duration"?: number;
  "tacticType"?: string;
  "creationDate"?: Date;
  "authorId"?: string;
  "author"?: any;
  "linkedModel"?: string;
  "linkedId"?: any;
  "linkedObject"?: any;
  "teamId"?: any;
  "id"?: any;
  "playerIds"?: Array<any>;
  "sharedPlayerIds"?: Array<any>;
  "staffIds"?: Array<any>;
  "sharedStaffIds"?: Array<any>;
  "_videoFile"?: any;
  "_thumb"?: any;
  "_attachments"?: Array<any>;
  "playerId"?: any;
  "playerScoutingId"?: any;
  players?: Player[];
  sharedPlayers?: Player[];
  staffs?: Staff[];
  sharedStaffs?: Staff[];
  videoFile?: Attachment[];
  thumb?: Attachment[];
  team?: Team;
  attachments?: Attachment[];
}

export class VideoAsset implements VideoAssetInterface {
  "category": string;
  "title": string;
  "subtitle": string;
  "tags": any;
  "notesThreads": Array<any>;
  "duration": number;
  "tacticType": string;
  "creationDate": Date;
  "authorId": string;
  "author": any;
  "linkedModel": string;
  "linkedId": any;
  "linkedObject": any;
  "teamId": any;
  "id": any;
  "playerIds": Array<any>;
  "sharedPlayerIds": Array<any>;
  "staffIds": Array<any>;
  "sharedStaffIds": Array<any>;
  "_videoFile": any;
  "_thumb": any;
  "_attachments": Array<any>;
  "playerId": any;
  "playerScoutingId": any;
  players: Player[];
  sharedPlayers: Player[];
  staffs: Staff[];
  sharedStaffs: Staff[];
  videoFile: Attachment[];
  thumb: Attachment[];
  team: Team;
  attachments: Attachment[];
  constructor(data?: VideoAssetInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `VideoAsset`.
   */
  public static getModelName() {
    return "VideoAsset";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of VideoAsset for dynamic purposes.
  **/
  public static factory(data: VideoAssetInterface): VideoAsset{
    return new VideoAsset(data);
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
      name: 'VideoAsset',
      plural: 'VideoAssets',
      path: 'VideoAssets',
      idName: 'id',
      properties: {
        "category": {
          name: 'category',
          type: 'string'
        },
        "title": {
          name: 'title',
          type: 'string'
        },
        "subtitle": {
          name: 'subtitle',
          type: 'string'
        },
        "tags": {
          name: 'tags',
          type: 'any'
        },
        "notesThreads": {
          name: 'notesThreads',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "duration": {
          name: 'duration',
          type: 'number'
        },
        "tacticType": {
          name: 'tacticType',
          type: 'string'
        },
        "creationDate": {
          name: 'creationDate',
          type: 'Date'
        },
        "authorId": {
          name: 'authorId',
          type: 'string'
        },
        "author": {
          name: 'author',
          type: 'any'
        },
        "linkedModel": {
          name: 'linkedModel',
          type: 'string'
        },
        "linkedId": {
          name: 'linkedId',
          type: 'any'
        },
        "linkedObject": {
          name: 'linkedObject',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "playerIds": {
          name: 'playerIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "sharedPlayerIds": {
          name: 'sharedPlayerIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "staffIds": {
          name: 'staffIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "sharedStaffIds": {
          name: 'sharedStaffIds',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "_videoFile": {
          name: '_videoFile',
          type: 'any'
        },
        "_thumb": {
          name: '_thumb',
          type: 'any'
        },
        "_attachments": {
          name: '_attachments',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        "playerId": {
          name: 'playerId',
          type: 'any'
        },
        "playerScoutingId": {
          name: 'playerScoutingId',
          type: 'any'
        },
      },
      relations: {
        players: {
          name: 'players',
          type: 'Player[]',
          model: 'Player',
          relationType: 'referencesMany',
                  keyFrom: 'playerIds',
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
        staffs: {
          name: 'staffs',
          type: 'Staff[]',
          model: 'Staff',
          relationType: 'referencesMany',
                  keyFrom: 'staffIds',
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
        videoFile: {
          name: 'videoFile',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsOne',
                  keyFrom: '_videoFile',
          keyTo: 'id'
        },
        thumb: {
          name: 'thumb',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsOne',
                  keyFrom: '_thumb',
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
        attachments: {
          name: 'attachments',
          type: 'Attachment[]',
          model: 'Attachment',
          relationType: 'embedsMany',
                  keyFrom: '_attachments',
          keyTo: 'id'
        },
      }
    }
  }
}
