/* tslint:disable */

declare var Object: any;
export interface ProfilePlayersInterface {
  "id"?: number;
}

export class ProfilePlayers implements ProfilePlayersInterface {
  "id": number;
  constructor(data?: ProfilePlayersInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `ProfilePlayers`.
   */
  public static getModelName() {
    return "ProfilePlayers";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of ProfilePlayers for dynamic purposes.
  **/
  public static factory(data: ProfilePlayersInterface): ProfilePlayers{
    return new ProfilePlayers(data);
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
      name: 'ProfilePlayers',
      plural: 'ProfilePlayers',
      path: 'ProfilePlayers',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'number'
        },
      },
      relations: {
      }
    }
  }
}
