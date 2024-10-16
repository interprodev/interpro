import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import {
	basicsGamePlayerPrimarySettings,
	GamePlayerMappingForm, RawMetrics,
	TeamIntegration
} from '../../models/integrations-third-parties.type';
import { MenuItem, SelectItem } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertService, sortByName } from '@iterpro/shared/utils/common-utils';
import { FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import presetsPlayer from '../../utils/presets/presetsPlayer';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { GenericRawMetricsComponent } from '../generic-raw-metrics/generic-raw-metrics.component';
import { isGamePlayerMappingDisabled } from '../../utils/setting-team-integration.utils';
import { ManualBlockedProviderPipe } from '../../pipes/manual-blocked-provider.pipe';
import { ProviderType } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-team-integration-game-player-mapping',
	standalone: true,
	imports: [PrimeNgModule, ReactiveFormsModule, TranslateModule, GenericRawMetricsComponent, ManualBlockedProviderPipe],
	templateUrl: './team-integration-game-player-mapping.component.html'
})
export class TeamIntegrationGamePlayerMappingComponent implements OnInit, OnChanges {
	@Input({ required: true }) formGroupName: string;
	@Input({ required: true }) team: TeamIntegration;
	@Input({ required: true }) saveClicked: boolean;
	@Input({ required: true }) editMode: boolean;
	@Input({ required: true }) dateFormatsOptions: SelectItem[];
	@Input({ required: true }) durationFormatsOptions: SelectItem[];
	// Services
	readonly #translateService = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	readonly #rootFormGroup = inject(FormGroupDirective);
	// Variables
	protected readonly basicPrimarySettingsSkeleton = basicsGamePlayerPrimarySettings;
	gamePlayerMappingForm: FormGroup<GamePlayerMappingForm>;
	mappingDisabled: boolean;
	presetMenuItems: MenuItem[];
	rawMetricsOptions: SelectItem[];
	uploadErrors: { severity: string; summary: string; detail: string };
	@ViewChild('fUpload', { static: false }) fileUploader: FileUpload;

	ngOnInit() {
		this.mappingDisabled = isGamePlayerMappingDisabled(this.team.providerPlayer as ProviderType);
		this.initOptions();
		this.loadPresetMenuItems();
		this.gamePlayerMappingForm = this.#rootFormGroup.control.get(
			this.formGroupName
		) as FormGroup<GamePlayerMappingForm>;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.editMode && this.gamePlayerMappingForm) {
			this.gamePlayerMappingForm = this.#rootFormGroup.control.get(
				this.formGroupName
			) as FormGroup<GamePlayerMappingForm>;
		}
	}

	//region Options
	private initOptions() {
		this.rawMetricsOptions = this.getRawMetricOptions(this.team._playerProviderMapping?.rawMetrics);
	}

	private getRawMetricOptions(value: { label: string; name: string }[] = []): SelectItem[] {
		return value.map(({ label, name }) => ({ label: label, value: name }));
	}
	//endregion

	///region Upload Sample / Preset
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
		this.gamePlayerMappingForm.controls.primarySettings.reset();
		this.gamePlayerMappingForm.controls.primarySettings.controls.mappingPresetPlayer.patchValue('Custom');
		this.gamePlayerMappingForm.controls.primarySettings.controls.custom.patchValue(true);
		const allTextLines = csv.split(/\r\n|\n/);
		const rawMetricsFromCsv = allTextLines[0].split(this.team.sepPlayer).map(item => ({ name: item, label: item }));
		const rawMetrics: RawMetrics[] = sortByName(rawMetricsFromCsv, 'label');
		this.rawMetricsOptions = this.getRawMetricOptions(rawMetrics);
		// reset raw metrics
		this.gamePlayerMappingForm.controls.rawMetrics.patchValue(rawMetrics);
		this.#alertService.notify('info', 'Third Parties', 'thirdParties.loadSample.success', false);
	}

	private loadPresetMenuItems() {
		this.presetMenuItems = [
			{
				label: 'InStat',
				command: () => this.loadPresetPlayer('InStat')
			},
			{
				label: 'PaniniDigital',
				command: () => this.loadPresetPlayer('PaniniDigital')
			}
		];
	}

	private loadPresetPlayer(provider: 'InStat' | 'PaniniDigital') {
		const _playerProviderMapping = presetsPlayer[provider];
		this.gamePlayerMappingForm.controls.primarySettings.patchValue(_playerProviderMapping);
		this.gamePlayerMappingForm.controls.primarySettings.controls.custom.patchValue(false);
		this.gamePlayerMappingForm.controls.primarySettings.controls.mappingPresetPlayer.patchValue(provider);
		const rawMetrics = sortByName(_playerProviderMapping.rawMetrics, 'label');
		this.rawMetricsOptions = this.getRawMetricOptions(rawMetrics);
	}
	//endregion
}
