import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
	basicGpsPrimarySettings,
	DefaultMetricsForm,
	GpsMappingForm,
	GPSMappingProvider,
	RawMetrics,
	RawMetricsForm,
	TeamIntegration
} from '../../models/integrations-third-parties.type';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { MenuItem, SelectItem } from 'primeng/api';
import { NgStyle } from '@angular/common';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import * as Papa from 'papaparse';
import { AlertService, sortByName } from '@iterpro/shared/utils/common-utils';
import { DeviceType, RawMetricType } from '@iterpro/shared/data-access/sdk';
import { ExpressionEditorComponent, FormFeedbackComponent } from '@iterpro/shared/ui/components';
import { ConfigForMetricPipe } from '../../pipes/config-for-metric.pipe';
import { GenericRawMetricsComponent } from '../generic-raw-metrics/generic-raw-metrics.component';
import { isGpsMappingDisabled, isSecuritySettingDisabled } from '../../utils/setting-team-integration.utils';
import { ManualBlockedProviderPipe } from '../../pipes/manual-blocked-provider.pipe';
import presets from '../../utils/presets/presets';
import { CustomerTeam } from '../../../../../../+state/settings.store';

@Component({
	selector: 'iterpro-team-integration-gps-mapping',
	standalone: true,
	imports: [
		TranslateModule,
		PrimeNgModule,
		ReactiveFormsModule,
		NgStyle,
		ExpressionEditorComponent,
		FormFeedbackComponent,
		ConfigForMetricPipe,
		GenericRawMetricsComponent,
		ManualBlockedProviderPipe
	],
	templateUrl: './team-integration-gps-mapping.component.html'
})
export class TeamIntegrationGpsMappingComponent implements OnInit, OnChanges {
	@Input({ required: true }) formGroupName: string;
	@Input({ required: true }) team: TeamIntegration;
	@Input({ required: true }) saveClicked: boolean;
	@Input({ required: true }) editMode: boolean;
	@Input({ required: true }) customer: CustomerTeam;
	@Input({ required: true }) dateFormatsOptions: SelectItem[];
	@Input({ required: true }) durationFormatsOptions: SelectItem[];
	// Services
	readonly #rootFormGroup = inject(FormGroupDirective);
	readonly #translateService = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	// Variables
	gpsMappingDisabled: boolean;
	securitySettingDisabled: boolean;
	gpsMappingForm: FormGroup<GpsMappingForm>;
	rawMetricsOptions: SelectItem[];
	basicPrimarySettingsSkeleton = basicGpsPrimarySettings;
	presetMenuItems: MenuItem[];
	uploadErrors: { severity: string; summary: string; detail: string };
	editorDialog = {
		visible: false,
		title: null,
		expression: null
	};
	@ViewChild('fUpload', { static: false }) fileUploader: FileUpload;
	ngOnInit() {
		this.gpsMappingDisabled = isGpsMappingDisabled(this.team.device as DeviceType);
		this.securitySettingDisabled = isSecuritySettingDisabled(this.team.device as DeviceType);
		this.initOptions();
		this.loadPresetMenuItems();
		this.gpsMappingForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<GpsMappingForm>;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.editMode && this.gpsMappingForm) {
			this.gpsMappingForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<GpsMappingForm>;
		}
	}

	//region Options
	private initOptions() {
		this.rawMetricsOptions = this.getRawMetricOptions(this.team._gpsProviderMapping?.rawMetrics);
	}

	private getRawMetricOptions(value: { label: string; name: string }[] = []): SelectItem[] {
		return value.map(({ label, name }) => ({ label: label, value: name }));
	}
	//endregion

	//region Upload Sample / Preset
	loadSample(event: FileSelectEvent) {
		for (const file of event.files) {
			const fileReader = new FileReader();
			fileReader.readAsText(file);
			fileReader.onload = e => {
				this.parseCsvFile(fileReader.result as string);
				this.fileUploader.clear();
			};
			fileReader.onerror = ev => {
				this.uploadErrors = {
					severity: 'error',
					summary: this.#translateService.instant('error'),
					detail: this.#translateService.instant('import.feedbacks.errorCSV')
				};
				this.fileUploader.clear();
			};
		}
	}

	private parseCsvFile(csv: string) {
		this.gpsMappingForm.controls.primarySettings.reset();
		this.gpsMappingForm.controls.primarySettings.controls.mappingPreset.patchValue('Custom');
		this.gpsMappingForm.controls.primarySettings.controls.custom.patchValue(true);
		const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
		const rawMetricsFromCsv = (parsed.meta.fields || []).map(item => ({
			name: item.replace(/\./g, '_').replace(/�/g, '_'),
			label: item.replace(/�/g, ' ') // this replacing allow to replace Specials (Unicode Blocks) with an empty space
		}));
		const rawMetrics: RawMetrics[] = sortByName(rawMetricsFromCsv, 'label').map(item => ({
			...item,
			type: RawMetricType.number
		}));
		this.rawMetricsOptions = this.getRawMetricOptions(rawMetrics);
		// reset expression field of default metrics
		this.gpsMappingForm.controls.defaultMetrics.controls.forEach((control: FormGroup<DefaultMetricsForm>) => {
			control.controls.expression.patchValue(null);
		});
		// reset raw metrics
		this.gpsMappingForm.controls.rawMetrics.patchValue(rawMetrics);
		this.#alertService.notify('info', 'Third Parties', 'thirdParties.loadSample.success', false);
	}

	private loadPresetMenuItems() {
		this.presetMenuItems = [
			{
				label: 'Playertek',
				command: () => this.loadPreset('Playertek')
			},
			{
				label: 'STATSport',
				command: () => this.loadPreset('STATSport')
			},
			{
				label: 'K-Sport',
				command: () => this.loadPreset('K-Sport')
			}
		];
	}

	private loadPreset(provider: GPSMappingProvider) {
		const _gpsProviderMapping = presets[provider]
			? presets[provider]
			: (this.customer._customPresets || []).find(({ name }) => name === provider);
		if (!_gpsProviderMapping) {
			this.#alertService.notify('error', 'Third Parties', 'thirdParties.loadPreset.error', false);
			return;
		}
		this.gpsMappingForm.controls.primarySettings.patchValue(_gpsProviderMapping);
		this.gpsMappingForm.controls.primarySettings.controls.custom.patchValue(false);
		this.gpsMappingForm.controls.primarySettings.controls.mappingPreset.patchValue(provider);
		this.gpsMappingForm.controls.defaultMetrics.patchValue(_gpsProviderMapping._gpsMetricsMapping);
		const rawMetrics = sortByName(_gpsProviderMapping.rawMetrics, 'label');
		this.rawMetricsOptions = this.getRawMetricOptions(rawMetrics);
	}
	//endregion

	//region Default Metrics (Expression Editor)
	openExpressionEditor(columnLabel: string, expression: string) {
		if (!this.editMode) return;
		this.editorDialog = {
			visible: true,
			title: columnLabel,
			expression: expression
		};
	}

	onExpressionSave(expression: string | null) {
		const control = this.gpsMappingForm.controls.defaultMetrics.controls.find(
			(x: FormGroup<DefaultMetricsForm>) => x.controls.columnLabel.value === this.editorDialog.title
		);
		if (control) {
			control.controls.expression.patchValue(expression);
			this.gpsMappingForm.markAsDirty();
		}
		this.editorDialog = {
			visible: false,
			title: null,
			expression: null
		};
		if (!expression) return;
	}
	//endregion
}
