import { Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
import { Comment, LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { TranslateModule } from '@ngx-translate/core';
import { CommentInputComponent } from '../comment-input/comment-input.component';
import { CommentComponent } from '../comment-component/comment.component';
import { NgForOf, NgIf } from '@angular/common';

@Component({
	standalone: true,
	imports: [CommentInputComponent, TranslateModule, CommentComponent, NgIf, NgForOf],
	selector: 'iterpro-comment-container',
	templateUrl: './comment-container.component.html',
	encapsulation: ViewEncapsulation.None
})
export class CommentContainerComponent implements OnChanges {
	@Input() comments: Comment[];
	@Input() editMode: boolean;
	@Output() commentsUpdated: EventEmitter<Comment[]> = new EventEmitter<Comment[]>();

	customer: any;
	// @ViewChild(Editor) newCommentEditor;

	// We're using the user service to obtain the currently logged
	// in user
	constructor(private userService: LoopBackAuth) {
		this.customer = this.userService.getCurrentUserData() || {};
	}

	// We use input change tracking to prevent dealing with
	// undefined comment list
	ngOnChanges(changes) {
		if (changes.comments && !changes.comments.currentValue) {
			this.comments = [];
		}
	}

	addNewComment(comment: Comment) {
		const comments = [comment, ...this.comments];
		this.commentsUpdated.next(comments);
	}

	// This method deals with edited comments
	onCommentEdited(comment: Comment, content: string) {
		const comments = this.comments.slice();
		// If the comment was edited with e zero length content, we
		// will delete the comment from the list
		if (content.length === 0) {
			comments.splice(comments.indexOf(comment), 1);
		} else {
			// Otherwise we're replacing the existing comment
			// TODO: check if "user: comment.user, time: comment.time" should be deleted, or if modifyDate should be created
			comments.splice(comments.indexOf(comment), 1, { ...comment, user: comment.user, time: comment.time, content });
		}
		// Emit event so the updated comment list can be persisted
		// outside the component
		this.commentsUpdated.next(comments);
	}

	onCommentDeleted(comment) {
		const comments = this.comments.slice();
		// const index = comments.findIndex(x => x.time === comment.time);
		comments.splice(comments.indexOf(comment), 1);
		this.commentsUpdated.next(comments);
	}
}
