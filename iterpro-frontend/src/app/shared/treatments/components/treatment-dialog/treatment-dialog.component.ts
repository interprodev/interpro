import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Attachment, LoopBackAuth, MEDICAL_FIELDS, TreatmentMetric } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';

@Component({
	selector: 'iterpro-treatment-dialog',
	templateUrl: './treatment-dialog.component.html',
	styleUrls: ['./treatment-dialog.component.css']
})
export class TreatmentDialogComponent {
	@Input() newMetric = true;
	@Input() treatments: TreatmentMetric[] = [];
	@Input() visible = false;
	@Input() editable = true;
	@Output() save: EventEmitter<TreatmentMetric> = new EventEmitter<TreatmentMetric>();
	@Output() discard: EventEmitter<void> = new EventEmitter<void>();

	treatmentTypes: SelectItem[] = [
		{ label: this.translate.instant('prevention.treatments.sec'), value: 'sec' },
		{ label: this.translate.instant('prevention.treatments.physiotherapy'), value: 'physiotherapy' }
	];

	treatmentCategories: SelectItem[] = [];
	treatmentIndex = 0;
	isLoadingVideo!: boolean;
	isLoadingDoc!: boolean;

	get treatment(): TreatmentMetric | undefined {
		return !!this.treatments && this.treatments.length > 0 ? this.treatments[this.treatmentIndex] : undefined;
	}

	constructor(private translate: TranslateService, private auth: LoopBackAuth) {
		const { physiotherapy } = MEDICAL_FIELDS;
		this.treatmentCategories = physiotherapy.map(({ label, value }) => ({
			value,
			label: label ? this.translate.instant(label) : ''
		}));
	}

	previous() {
		this.treatmentIndex--;
	}
	next() {
		this.treatmentIndex++;
	}

	saveTreatment() {
		this.save.emit(this.treatment);
	}

	discardTreatment() {
		this.discard.emit();
	}

	startUploadVideo = () => {
		this.isLoadingVideo = true;
	};

	startUploadDoc = () => {
		this.isLoadingDoc = true;
	};

	addVideo = (downloadUrl: string, url: string, name: string) => {
		if (this.treatment) this.treatment.video = this.createAttachment(downloadUrl, url, name);
		this.isLoadingVideo = false;
	};

	deleteVideo() {
		if (this.treatment) this.treatment.video = undefined;
	}

	addDocument = (downloadUrl: string, url: string, name: string) => {
		if (this.treatment) this.treatment.doc = this.createAttachment(downloadUrl, url, name);
		this.isLoadingDoc = false;
	};

	deleteDocument() {
		if (this.treatment) this.treatment.doc = undefined;
	}

	private createAttachment(downloadUrl: string, url: string, name: string): Attachment {
		const author = this.auth.getCurrentUserData();
		return new Attachment({
			name,
			downloadUrl,
			url,
			date: new Date(),
			authorId: author.id
		});
	}
}
