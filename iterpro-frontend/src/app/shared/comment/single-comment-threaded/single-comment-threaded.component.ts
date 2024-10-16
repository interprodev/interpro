import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommentComponent } from '../comment-component/comment.component';
import { CommentInputComponent } from '../comment-input/comment-input.component';

@Component({
	standalone: true,
	imports: [CommonModule, CommentComponent, CommentInputComponent],
	selector: 'iterpro-single-comment-threaded',
	templateUrl: './single-comment-threaded.component.html',
	styleUrls: ['./single-comment-threaded.component.css']
})
export class SingleCommentThreadedComponent {
	@Input() comment;
	@Input() customer: any;
	@Input() editMode: boolean;
	@Output() viewThread: EventEmitter<any> = new EventEmitter();
	@Output() edit: EventEmitter<any> = new EventEmitter();
	@Output() reply: EventEmitter<any> = new EventEmitter();
	@Output() remove: EventEmitter<any> = new EventEmitter();

	allowed(comment) {
		return this.customer && this.customer.id === comment.userId;
	}

	addComment(comment, parent) {
		this.reply.emit({ comment, parent });
	}

	onCommentEdited(comment, content, parent = null) {
		if (!this.allowed(comment)) return;
		this.edit.emit({ comment, content, parent });
	}

	onCommentDeleted(comment, parent = null) {
		if (!this.allowed(comment)) return;
		this.remove.emit({ comment, parent });
	}

	onCommentReplies(comment) {
		this.viewThread.emit(comment);
	}
}
