/* tslint:disable */

declare var Object: any;
export interface AzureStorageInterface {
  "id"?: number;
}

export class AzureStorage implements AzureStorageInterface {
  "id": number;
  constructor(data?: AzureStorageInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `AzureStorage`.
   */
  public static getModelName() {
    return "AzureStorage";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of AzureStorage for dynamic purposes.
  **/
  public static factory(data: AzureStorageInterface): AzureStorage{
    return new AzureStorage(data);
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
      name: 'AzureStorage',
      plural: 'AzureStorage',
      path: 'AzureStorage',
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
