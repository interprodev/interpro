/* tslint:disable */
import {
  Customer
} from '../index';

declare var Object: any;
export interface EntityChangelogInterface {
  "date": Date;
  "description": string;
  "id"?: any;
  "authorId"?: any;
  "entityId"?: any;
  "entityType"?: string;
  author?: Customer;
  entity?: any;
}

export class EntityChangelog implements EntityChangelogInterface {
  "date": Date;
  "description": string;
  "id": any;
  "authorId": any;
  "entityId": any;
  "entityType": string;
  author: Customer;
  entity: any;
  constructor(data?: EntityChangelogInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `EntityChangelog`.
   */
  public static getModelName() {
    return "EntityChangelog";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of EntityChangelog for dynamic purposes.
  **/
  public static factory(data: EntityChangelogInterface): EntityChangelog{
    return new EntityChangelog(data);
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
      name: 'EntityChangelog',
      plural: 'EntityChangelogs',
      path: 'EntityChangelogs',
      idName: 'id',
      properties: {
        "date": {
          name: 'date',
          type: 'Date'
        },
        "description": {
          name: 'description',
          type: 'string'
        },
        "id": {
          name: 'id',
          type: 'any'
        },
        "authorId": {
          name: 'authorId',
          type: 'any'
        },
        "entityId": {
          name: 'entityId',
          type: 'any'
        },
        "entityType": {
          name: 'entityType',
          type: 'string'
        },
      },
      relations: {
        author: {
          name: 'author',
          type: 'Customer',
          model: 'Customer',
          relationType: 'belongsTo',
                  keyFrom: 'authorId',
          keyTo: 'id'
        },
        entity: {
          name: 'entity',
          type: 'any',
          model: '',
          relationType: 'belongsTo',
                  keyFrom: 'entityId',
          keyTo: 'id'
        },
      }
    }
  }
}
