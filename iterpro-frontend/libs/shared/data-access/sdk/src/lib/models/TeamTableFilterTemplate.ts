/* tslint:disable */
import {
  Customer,
  Team
} from '../index';

declare var Object: any;
export interface TeamTableFilterTemplateInterface {
  "creationDate": Date;
  "lastUpdateDate"?: Date;
  "tableId"?: string;
  "templateName"?: string;
  "filters": any;
  "visibility": any;
  "id"?: any;
  "lastUpdateAuthorId"?: any;
  "teamId"?: any;
  lastUpdateAuthor?: Customer;
  team?: Team;
}

export class TeamTableFilterTemplate implements TeamTableFilterTemplateInterface {
  "creationDate": Date;
  "lastUpdateDate": Date;
  "tableId": string;
  "templateName": string;
  "filters": any;
  "visibility": any;
  "id": any;
  "lastUpdateAuthorId": any;
  "teamId": any;
  lastUpdateAuthor: Customer;
  team: Team;
  constructor(data?: TeamTableFilterTemplateInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TeamTableFilterTemplate`.
   */
  public static getModelName() {
    return "TeamTableFilterTemplate";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TeamTableFilterTemplate for dynamic purposes.
  **/
  public static factory(data: TeamTableFilterTemplateInterface): TeamTableFilterTemplate{
    return new TeamTableFilterTemplate(data);
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
      name: 'TeamTableFilterTemplate',
      plural: 'TeamTableFilterTemplates',
      path: 'TeamTableFilterTemplates',
      idName: 'id',
      properties: {
        "creationDate": {
          name: 'creationDate',
          type: 'Date'
        },
        "lastUpdateDate": {
          name: 'lastUpdateDate',
          type: 'Date'
        },
        "tableId": {
          name: 'tableId',
          type: 'string'
        },
        "templateName": {
          name: 'templateName',
          type: 'string'
        },
        "filters": {
          name: 'filters',
          type: 'any',
          default: <any>null
        },
        "visibility": {
          name: 'visibility',
          type: 'any',
          default: <any>null
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "lastUpdateAuthorId": {
          name: 'lastUpdateAuthorId',
          type: 'any'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
      },
      relations: {
        lastUpdateAuthor: {
          name: 'lastUpdateAuthor',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'lastUpdateAuthorId',
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
      }
    }
  }
}
