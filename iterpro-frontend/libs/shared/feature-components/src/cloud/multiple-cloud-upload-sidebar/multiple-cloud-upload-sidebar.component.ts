import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MultiFileUpload, UploadStatus } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import * as moment from 'moment';
import { CloudUploadQueueService } from '../cloud-upload-queue.service';
import { DurationLabelPipe } from '@iterpro/shared/ui/pipes';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, PrimeNgModule, DurationLabelPipe],
	selector: 'iterpro-multiple-cloud-upload-sidebar',
	templateUrl: './multiple-cloud-upload-sidebar.component.html',
	styleUrls: ['./multiple-cloud-upload-sidebar.component.scss']
})
export class MultipleCloudUploadSidebarComponent implements OnInit {
	sideBarVisibility!: boolean;
	queueFiles!: MultiFileUpload[];
	queueInProgress!: boolean;
	queueCompleted!: boolean;
	openSideBarButtonVisibility!: boolean;
	uploadStatuses = UploadStatus;

	readonly #cloudUploadQueueService = inject(CloudUploadQueueService);

	ngOnInit(): void {
		this.readFileQueue();
	}

	private readFileQueue() {
		this.#cloudUploadQueueService.queue.subscribe((files: MultiFileUpload[]) => {
			this.queueFiles = files;
			this.queueInProgress = this.queueFiles.some(
				({ status }) => status === UploadStatus.NotStarted || status === UploadStatus.Uploading
			);
			this.queueCompleted = this.queueFiles.every(({ status }) => status === UploadStatus.Done);
			this.openSideBarButtonVisibility = this.queueFiles.length > 0;
		});
	}

	getUploadStatusLabel(file: MultiFileUpload): string {
		switch (file.status) {
			case UploadStatus.Uploading:
				return 'in upload';
			case UploadStatus.Done:
				return 'upload completed';
			case UploadStatus.NotStarted:
				return 'waiting for start';
			case UploadStatus.Error:
				return 'error';
			case UploadStatus.VideoSaved:
				return 'video saved';
			default:
				console.warn('status not supported');
				return '';
		}
	}

	closeSideBar() {
		this.sideBarVisibility = false;
		this.openSideBarButtonVisibility = this.queueInProgress;
	}
}
