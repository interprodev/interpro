import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommentInputComponent } from '../comment-input/comment-input.component';
import { CommentThreadedComponent } from '../comment-threaded/comment-threaded.component';
import { SingleCommentThreadedComponent } from '../single-comment-threaded/single-comment-threaded.component';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { CommentComponent } from '../comment-component/comment.component';

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, TranslateModule, CommentInputComponent, SingleCommentThreadedComponent, PrimeNgModule, CommentComponent],
	selector: 'iterpro-vertical-comment-threaded',
	templateUrl: './vertical-comment-threaded.component.html',
	styleUrls: ['../comment-threaded/comment-threaded.component.css', './vertical-comment-threaded.component.css']
})
export class VerticalCommentThreadedComponent extends CommentThreadedComponent {
	backToMainThread() {
		this.currentThread = null;
	}
}
