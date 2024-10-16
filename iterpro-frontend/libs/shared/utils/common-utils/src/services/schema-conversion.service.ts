import { Injectable, inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import {
	JsonPropertySchema,
	JsonSchema,
	JsonSectionSchema,
	Metadata,
	PropertyDefinitionSchema,
	PropertySchema,
	PropertyType,
	Schema,
	SectionSchema
} from '@iterpro/shared/data-access/sdk';
import { fromPairs, omit, sortBy } from 'lodash';
import { FormService } from './form.service';

@Injectable()
export class SchemaConversionService {
	readonly #formService = inject(FormService);

	fromFormToSchema(form: Schema): JsonSchema {
		const converted: any = {
			...form,
			sections: form.sections.map(({ id, title, properties }: SectionSchema) => ({
				id,
				title,
				schema: this.getSchemaSection(properties)
			}))
		};

		return converted as JsonSchema;
	}

	fromSchemaToForm(form: FormGroup, jsonSchema: JsonSchema): FormGroup {
		const schema = this.convertToFormStructure(jsonSchema);
		(form.get('sections') as FormArray).clear();
		schema.sections.forEach(section => {
			const sectionF: FormGroup = this.#formService.newSection();
			(form.get('sections') as FormArray).push(sectionF);
			this.getOrderedProperties(section.properties, section?.metadata?.order).forEach(property => {
				const propertyF: FormGroup = this.#formService.newProperty();
				(sectionF.get('properties') as FormArray).push(propertyF);
				property.colorMapping?.forEach(() => {
					const mappingF: FormGroup = this.#formService.newColorMapping();
					(propertyF.get('colorMapping') as FormArray).push(mappingF);
				});
			});
		});
		form.patchValue(schema);
		return form;
	}

	getOrderedProperties(properties: PropertySchema[], order: string[] | undefined): PropertySchema[] {
		if (!order) return properties;
		return properties.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
	}

	public convertToFormStructure(schema: JsonSchema): Schema {
		if (schema.title === standardTemplate.title && schema.version === standardTemplate.version) {
			return standardTemplate as any;
		}

		return {
			title: schema.title,
			id: schema._id,
			version: schema.version,
			sections: schema.sections.map((section: any) => ({
				id: section.id,
				title: section.title,
				properties: sortBy(
					Object.entries(section.schema.properties).map(([name, value]: [string, any]) => ({
						name,
						type: value.enum ? 'enum' : value.ref ? 'Function' : value.type,
						enum: value.enum || [],
						operation: value.operation || {
							name: '',
							parameters: []
						},
						...value.metadata
					})),
					'name'
				),
				metadata: section.schema.metadata
			}))
		};
	}

	private getSchemaSection(propertySchemas: PropertySchema[]): JsonSectionSchema {
		const properties = this.convertPropertyArray(propertySchemas);
		const definitions = propertySchemas.some(({ type }) => type === 'Function')
			? this.getFunctionDefinition()
			: undefined;
		const metadata: Metadata = {
			order: propertySchemas.map(({ name }) => name)
		};
		return { properties, definitions, metadata };
	}

	convertPropertyArray(properties: PropertySchema[]): Record<string, JsonPropertySchema> {
		return fromPairs(
			properties.map(({ name, type, ...metadata }) => [
				name,
				{
					[this.getType(type)]: type === 'enum' ? metadata.enum : type,
					metadata: omit(metadata, type === 'Function' ? ['enum'] : ['enum', 'operation'])
				}
			])
		);
	}

	private getFunctionDefinition(): Record<'Function', PropertyDefinitionSchema> {
		return {
			Function: {
				properties: {
					operation: {
						enum: ['sum', 'occurrence', 'average']
					},
					value: {
						type: 'float32'
					}
				}
			}
		};
	}

	private getType(type: PropertyType): string {
		switch (type) {
			case 'enum':
				return 'enum';
			case 'Function':
				return 'ref';
			default:
				return 'type';
		}
	}
}

export const standardTemplate = {
	title: 'STANDARD',
	id: null,
	version: null,
	sections: []
};
