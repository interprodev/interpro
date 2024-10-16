/* tslint:disable */

declare var Object: any;
export interface TransferWindowInterface {
  "id"?: string;
  "name"?: string;
  "start"?: Date;
  "end"?: Date;
  "budget"?: number;
}

export class TransferWindow implements TransferWindowInterface {
  "id": string;
  "name": string;
  "start": Date;
  "end": Date;
  "budget": number;
  constructor(data?: TransferWindowInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `TransferWindow`.
   */
  public static getModelName() {
    return "TransferWindow";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of TransferWindow for dynamic purposes.
  **/
  public static factory(data: TransferWindowInterface): TransferWindow{
    return new TransferWindow(data);
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
      name: 'TransferWindow',
      plural: 'TransferWindows',
      path: 'TransferWindows',
      idName: 'id',
      properties: {
        "id": {
          name: 'id',
          type: 'string'
        },
        "name": {
          name: 'name',
          type: 'string'
        },
        "start": {
          name: 'start',
          type: 'Date'
        },
        "end": {
          name: 'end',
          type: 'Date'
        },
        "budget": {
          name: 'budget',
          type: 'number'
        },
      },
      relations: {
      }
    }
  }
}
