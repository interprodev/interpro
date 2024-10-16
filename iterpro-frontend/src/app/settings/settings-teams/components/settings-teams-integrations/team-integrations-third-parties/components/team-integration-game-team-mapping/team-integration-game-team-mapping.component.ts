import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import {
	basicsGameTeamPrimarySettings, DefaultMetricsForm,
	GameTeamMappingForm, RawMetrics,
	TeamIntegration
} from '../../models/integrations-third-parties.type';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { MenuItem, SelectItem } from 'primeng/api';
import presetsTeam from '../../utils/presets/presetsTeam';
import { AlertService, sortByName } from '@iterpro/shared/utils/common-utils';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { GenericRawMetricsComponent } from '../generic-raw-metrics/generic-raw-metrics.component';
import { isGameTeamMappingDisabled } from '../../utils/setting-team-integration.utils';
import { ManualBlockedProviderPipe } from '../../pipes/manual-blocked-provider.pipe';
import { ProviderType } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-team-integration-game-team-mapping',
	standalone: true,
	imports: [TranslateModule, ReactiveFormsModule, PrimeNgModule, GenericRawMetricsComponent, ManualBlockedProviderPipe],
	templateUrl: './team-integration-game-team-mapping.component.html'
})
export class TeamIntegrationGameTeamMappingComponent implements OnInit, OnChanges {
	@Input({ required: true }) formGroupName: string;
	@Input({ required: true }) team: TeamIntegration;
	@Input({ required: true }) saveClicked: boolean;
	@Input({ required: true }) editMode: boolean;
	@Input({ required: true }) dateFormatsOptions: SelectItem[];
	@Input({ required: true }) durationFormatsOptions: SelectItem[];
	// Services
	#translateService = inject(TranslateService);
	#alertService = inject(AlertService);
	#rootFormGroup = inject(FormGroupDirective);
	// Variables
	protected readonly basicPrimarySettingsSkeleton = basicsGameTeamPrimarySettings;
	gameTeamMappingForm: FormGroup<GameTeamMappingForm>;
	mappingDisabled: boolean;
	presetMenuItems: MenuItem[];
	rawMetricsOptions: SelectItem[];
	uploadErrors: { severity: string; summary: string; detail: string };
	@ViewChild('fUpload', { static: false }) fileUploader: FileUpload;

	ngOnInit() {
		this.mappingDisabled = isGameTeamMappingDisabled(this.team.providerTeam as ProviderType);
		this.initOptions();
		this.loadPresetMenuItems();
		this.gameTeamMappingForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<GameTeamMappingForm>;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.editMode && this.gameTeamMappingForm) {
			this.gameTeamMappingForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<GameTeamMappingForm>;
		}
	}

	//region Options
	private initOptions() {
		this.rawMetricsOptions = this.getRawMetricOptions(this.team._teamProviderMapping?.rawMetrics);
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
		this.gameTeamMappingForm.controls.primarySettings.reset();
		this.gameTeamMappingForm.controls.primarySettings.controls.mappingPresetTeam.patchValue('Custom');
		this.gameTeamMappingForm.controls.primarySettings.controls.custom.patchValue(true);
		const allTextLines = csv.split(/\r\n|\n/);
		const rawMetricsFromCsv = allTextLines[0].split(this.team.sepPlayer).map(item => ({ name: item, label: item }));
		const rawMetrics: RawMetrics[] = sortByName(rawMetricsFromCsv, 'label');
		this.rawMetricsOptions = this.getRawMetricOptions(rawMetrics);
		// reset raw metrics
		this.gameTeamMappingForm.controls.rawMetrics.patchValue(rawMetrics);
		this.#alertService.notify('info', 'Third Parties', 'thirdParties.loadSample.success', false);
	}

	private loadPresetMenuItems() {
		this.presetMenuItems = [
			{
				label: 'InStat',
				command: () => this.loadPresetTeam('InStat')
			},
			{
				label: 'PaniniDigital',
				command: () => this.loadPresetTeam('PaniniDigital')
			}
		];
	}

	loadPresetTeam(provider: 'InStat' | 'PaniniDigital') {
		const _teamProviderMapping = presetsTeam[provider];
		this.gameTeamMappingForm.controls.primarySettings.patchValue(_teamProviderMapping);
		this.gameTeamMappingForm.controls.primarySettings.controls.custom.patchValue(false);
		this.gameTeamMappingForm.controls.primarySettings.controls.mappingPresetTeam.patchValue(provider);
		const rawMetrics = sortByName(_teamProviderMapping.rawMetrics, 'label');
		this.rawMetricsOptions = this.getRawMetricOptions(rawMetrics);
	}
	//endregion
}
