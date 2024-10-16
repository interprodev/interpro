/* tslint:disable */

declare var Object: any;
export interface ChatInterface {
  "id"?: number;
}

export class Chat implements ChatInterface {
  "id": number;
  constructor(data?: ChatInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Chat`.
   */
  public static getModelName() {
    return "Chat";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Chat for dynamic purposes.
  **/
  public static factory(data: ChatInterface): Chat{
    return new Chat(data);
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
      name: 'Chat',
      plural: 'Chat',
      path: 'Chat',
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
