import { ColorMappingSchema, OperationType, PropertySchema, PropertyType } from './schema';

/*
	_id is the id of the document in the database, that is generated when the document is created.
	_key is the id of the version 1 of the document in the database, that is generated when the document is created. (never change)
	at the first version of the document, _id and _key are the same.
	from the second version of the document, _id is the id of the document in the database and _key is the id of the first version of the document in the database.
*/

export interface JsonSchema {
	_id?: string;
	_key?: string;
	clubId: string;
	teamId: string;
	title: string;
	version?: number;
	sections: JsonSection[];
	validations?: any;
}

export interface JsonSection {
	id: string;
	title: string;
	schema: JsonSectionSchema;
}

export interface JsonSectionSchema {
	properties: Record<string, JsonPropertySchema>;
	metadata: Metadata;
	definitions?: Partial<Record<PropertyType, PropertyDefinitionSchema>>;
}

export interface JsonPropertySchema {
	type?: PropertyType;
	metadata?: Metadata;
	ref?: PropertyType;
	enum?: string[];
}

export interface PropertyDefinitionSchema {
	properties: {
		operation: {
			enum: OperationType[];
		};
		value: {
			type: PropertyType;
		};
	};
}

export type Metadata = Partial<
	Omit<PropertySchema, 'name' | 'type' | 'colorMapping'> & { colorMapping?: Partial<ColorMappingSchema>[] } & {
		order?: string[];
	}
>;
