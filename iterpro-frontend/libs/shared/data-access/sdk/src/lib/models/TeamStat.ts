/* tslint:disable */

declare var Object: any;
export interface TeamStatInterface {
  "id"?: string;
  "gameName"?: string;
  "teamId"?: any;
  "rawFields"?: Array<any>;
}

export class TeamStat implements TeamStatInterface {
  "id": string;
  "gameName": string;
  "teamId": any;
  "rawFields": Array<any>;
  constructor(data?: TeamStatInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TeamStat`.
   */
  public static getModelName() {
    return "TeamStat";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TeamStat for dynamic purposes.
  **/
  public static factory(data: TeamStatInterface): TeamStat{
    return new TeamStat(data);
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
      name: 'TeamStat',
      plural: 'TeamStats',
      path: 'TeamStats',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "gameName": {
          name: 'gameName',
          type: 'string'
        },
        "teamId": {
          name: 'teamId',
          type: 'any'
        },
        "rawFields": {
          name: 'rawFields',
          type: 'Array&lt;any&gt;'
        },
      },
      relations: {
      }
    }
  }
}
