import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
	FormArray,
	FormBuilder,
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators
} from '@angular/forms';
import { JsonSchema, OperationType, PropertySchema, PropertyType } from '@iterpro/shared/data-access/sdk';
import { SelectItemPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	FormService,
	SchemaConversionService,
	getOptionsByType
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep, has } from 'lodash';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { CustomReportTemplateComponent } from '../custom-report-template/custom-report-template.component';
import { CustomReportDataChangeOutput } from '../custom-report-template/models/custom-report-template.model';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		PrimeNgModule,
		TranslateModule,
		SelectItemPipe,
		CustomReportTemplateComponent
	],
	providers: [FormService, SchemaConversionService],
	selector: 'iterpro-custom-report-template-editor',
	templateUrl: './custom-report-template-editor.component.html',
	styleUrls: ['./custom-report-template-editor.component.scss']
})
export class CustomReportTemplateEditorComponent implements OnChanges {
	@Input() show = true;
	@Input() template!: JsonSchema;
	@Input() debug = false;
	@Output() save: EventEmitter<JsonSchema> = new EventEmitter<JsonSchema>();
	@Output() discard: EventEmitter<void> = new EventEmitter<void>();

	operations: SelectItem<OperationType>[] = [
		{ value: 'sum', label: 'scouting.gameReportTemplate.operationSum' },
		{ value: 'average', label: 'scouting.gameReportTemplate.operationAverage' },
		{ value: 'occurrence', label: 'scouting.gameReportTemplate.operationOccurrence' }
	];
	types: SelectItem<PropertyType>[] = [
		{ value: 'int16', label: 'scouting.gameReportTemplate.typeInteger' },
		{ value: 'float32', label: 'scouting.gameReportTemplate.typeDecimal' },
		{ value: 'string', label: 'scouting.gameReportTemplate.typeString' },
		{ value: 'boolean', label: 'scouting.gameReportTemplate.typeBoolean' },
		{ value: 'enum', label: 'scouting.gameReportTemplate.typeEnum' },
		{ value: 'Function', label: 'scouting.gameReportTemplate.typeFunction' }
	];

	form: FormGroup = this.fb.group({
		title: ['', Validators.required],
		sections: this.fb.array([], Validators.minLength(1))
		// validations:
	});

	previewInstance: any = {};
	draggedProperty!: FormGroup | undefined;
	draggedPropertyIndex!: number | undefined;
	draggedSectionIndex!: number | undefined;

	get sections(): FormArray {
		return this.form.get('sections') as FormArray;
	}

	constructor(
		private fb: FormBuilder,
		private alert: AlertService,
		private formService: FormService,
		private translate: TranslateService,
		private confirmationService: ConfirmationService,
		private conversionService: SchemaConversionService
	) {
		this.operations = this.operations.map(operation => ({
			...operation,
			label: this.translate.instant(operation.label as string)
		}));
		this.types = this.types.map(type => ({
			...type,
			label: this.translate.instant(type.label as string)
		}));
		this.form = this.formService.newForm();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['template']) {
			if (this.template) {
				this.form = this.template
					? this.conversionService.fromSchemaToForm(this.form, this.template)
					: this.formService.newForm();
			}
		}
	}

	onSubmit() {
		// TODO: we should discard if the templates has not been changed, but it's difficult to compare the form with the original template
		const templateToSave = this.conversionService.fromFormToSchema(this.form.value);
		const finalTemplate = {
			...this.template,
			...templateToSave
		};
		this.confirmationService.confirm({
			message: this.translate.instant('scouting.gamereportstemplates.saveTemplate'),
			header: 'Iterpro',
			acceptLabel: this.translate.instant('buttons.save'),
			rejectLabel: this.translate.instant('buttons.discard'),
			accept: () => {
				this.save.emit(finalTemplate);
			}
		});
	}

	private getSectionProperties(section: FormGroup): FormArray {
		return section.get('properties') as FormArray;
	}
	getSectionPropertiesControls(section: FormGroup): FormGroup[] {
		return this.getSectionProperties(section).controls as FormGroup[];
	}

	private getPropertiesColorMapping(property: FormGroup): FormArray {
		return property.get('colorMapping') as FormArray;
	}

	getPropertiesColorMappingControls(property: FormGroup): FormGroup[] {
		return this.getPropertiesColorMapping(property).controls as FormGroup[];
	}

	getPropertiesEnum(property: FormGroup): FormControl {
		return property.get('enum') as FormControl;
	}

	getPropertiesString(property: FormGroup): FormControl {
		return property.get('fields') as FormControl;
	}

	getOtherSectionProperties(section: FormGroup, thisName: string): SelectItem[] {
		return this.getSectionProperties(section)
			.value.filter(({ name }: { name: string }) => name !== thisName)
			.map(({ name: value, label }: { name: string; label: string }) => ({ value, label }));
	}

	addSection() {
		this.sections.push(this.formService.newSection());
	}

	removeSection(index: number) {
		this.sections.removeAt(index);
	}

	addProperty(section: FormGroup) {
		this.getSectionProperties(section).push(this.formService.newProperty());
	}

	duplicateProperty(section: FormGroup, property: FormGroup) {
		const duplicatedProperty = cloneDeep(property);
		this.getSectionProperties(section).push(duplicatedProperty);
	}

	removeProperty(section: FormGroup, pIndex: number) {
		this.getSectionProperties(section).removeAt(pIndex);
	}

	addColorMapping(property: FormGroup) {
		this.getPropertiesColorMapping(property).push(this.formService.newColorMapping());
	}

	removeColorMapping(property: FormGroup, cIndex: number) {
		this.getPropertiesColorMapping(property).removeAt(cIndex);
	}

	// addEnumValue(property: FormGroup) {
	// 	this.getPropertiesEnum(property).push(this.fb.control(''));
	// }

	// removeEnumValue(property: FormGroup, eIndex: number) {
	// 	this.getPropertiesEnum(property).removeAt(eIndex);
	// }

	isNumber({ value }: { value: PropertySchema }): boolean {
		return value.type === 'int16' || value.type === 'float32';
	}

	getFractionDigits({ value }: { value: PropertySchema }): number {
		switch (value.type) {
			case 'float32':
				return 1;
			case 'int16':
			default:
				return 0;
		}
	}

	isString(property: FormGroup): boolean {
		return property.value.type === 'string';
	}

	isEnum(property: FormGroup): boolean {
		return property.value.type === 'enum';
	}

	isOperation(property: FormGroup): boolean {
		return property.value.type === 'Function';
	}

	isBoolean(property: FormGroup): boolean {
		return property.value.type === 'boolean';
	}

	isOperationOccurrence(property: FormGroup): boolean {
		return this.isOperation(property) && property.value.operation.name === 'occurrence';
	}

	isOperationSum(property: FormGroup): boolean {
		return this.isOperation(property) && property.value.operation.name === 'sum';
	}

	isOperationAvg(property: FormGroup): boolean {
		return this.isOperation(property) && property.value.operation.name === 'average';
	}

	cancel() {
		this.discard.emit();
	}

	getLocale(): string {
		return this.translate.currentLang;
	}

	// PREVIEW

	getOptionsByType(property: PropertySchema): SelectItem[] {
		return getOptionsByType(property);
	}

	onReportDataChange({ propertyName, eventValue }: CustomReportDataChangeOutput) {
		this.previewInstance[propertyName] = eventValue;
	}
	//endregion

	//region DragAndDrop
	dragStart(property: FormGroup, sectionIndex: number, propertyIndex: number) {
		this.draggedProperty = property;
		this.draggedSectionIndex = sectionIndex;
		this.draggedPropertyIndex = propertyIndex;
	}

	dragEnd() {
		this.resetDraggedProperties();
	}

	drop(newIndex: number) {
		if (this.draggedProperty && this.draggedSectionIndex && this.draggedPropertyIndex) {
			const allSections = this.sections;
			const properties = allSections.at(this.draggedSectionIndex).get('properties') as FormArray;
			const currentGroup = properties.at(this.draggedPropertyIndex);
			properties.removeAt(this.draggedPropertyIndex);
			properties.insert(newIndex, currentGroup);
			this.resetDraggedProperties();
			this.alert.notify('info', 'scouting.game.reportText', 'Element successfully moved');
		}
	}

	private resetDraggedProperties() {
		this.draggedProperty = undefined;
		this.draggedSectionIndex = undefined;
		this.draggedPropertyIndex = undefined;
	}
	//endregion
}
