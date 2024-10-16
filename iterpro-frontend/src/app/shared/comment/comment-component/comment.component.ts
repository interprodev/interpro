import { NgForOf, NgIf } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AttachmentComponent } from '@iterpro/shared/ui/components';
import { AzureStoragePipe, FormatDateUserSettingPipe, getColor } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Comment, Customer } from '@iterpro/shared/data-access/sdk';
import { FromNowPipe } from '@iterpro/shared/ui/pipes';

@Component({
	standalone: true,
	imports: [NgIf, TranslateModule, AzureStoragePipe, AttachmentComponent, PrimeNgModule, FormsModule, FormatDateUserSettingPipe, NgForOf, FromNowPipe],
	selector: 'iterpro-comment',
	templateUrl: './comment.component.html',
	styleUrls: ['./comment.component.css']
})
export class CommentComponent implements OnInit {
	@Input() comment: Comment;
	@Input() customer: Customer;
	@Input() focused = false;
	@Input() showReply = false;
	@Input() editMode: boolean;

	@Output() commentEdited = new EventEmitter();
	@Output() commentDeleted = new EventEmitter();
	@Output() commentReply = new EventEmitter();

	showAttachments = true;

	edit = false;
	temp: string;

	readonly #translate = inject(TranslateService);

	items: MenuItem[];

	itemsReply: MenuItem[];

	itemsEdit: MenuItem[];

	ngOnInit(): void {
		this.items =  [
			{
				label: this.#translate.instant('buttons.edit'),
				icon: 'fas fa-pencil',
				command: () => {
					this.onEdit();
				}
			},
			{
				label: this.#translate.instant('buttons.delete'),
				icon: 'fas fa-close',
				command: () => {
					this.onDelete();
				}
			}
		];

		this.itemsReply = [
			{
				label: this.#translate.instant('buttons.reply'),
				icon: 'fas fa-reply',
				command: () => {
					this.onReply();
				}
			},
			{
				label: this.#translate.instant('buttons.edit'),
				visible: this.isAuthorized(),
				icon: 'fas fa-pencil',
				command: () => {
					this.onEdit();
				}
			},
			{
				label: this.#translate.instant('buttons.delete'),
				visible: this.isAuthorized(),
				icon: 'fas fa-close',
				command: () => {
					this.onDelete();
				}
			}
		];

		this.itemsEdit = [
			{
				label: this.#translate.instant('buttons.save'),
				icon: 'fas fa-save',
				command: () => {
					this.onSave();
				}
			},
			{
				label: this.#translate.instant('buttons.discard'),
				icon: 'fas fa-close',
				command: () => {
					this.onDiscard();
				}
			}
		];
	}
	onSave() {
		this.edit = false;
		this.commentEdited.next(this.comment.content);
	}

	onDelete() {
		this.commentDeleted.next(this.comment);
	}

	onReply() {
		this.commentReply.next(this.comment);
	}

	onShowAttachments() {
		this.showAttachments = !this.showAttachments;
	}

	onEdit() {
		this.temp = this.comment.content;
		this.edit = true;
	}

	onDiscard() {
		this.comment.content = this.temp;
		this.edit = false;
	}

	isAuthorized(): boolean {
		if (!this.customer) return false;
		return this.comment.userId === this.customer.id;
	}

	getColor(): string {
		return getColor(this.comment.user);
	}

	isToday(): boolean {
		if (!this.comment || !this.comment.time) return false;
		const time = moment(this.comment.time);
		return moment().isSame(time, 'day');
	}
}
