import { NgClass, NgIf, NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [NgClass, NgStyle, RouterLink, TranslateModule],
	selector: 'iterpro-launchpad-block',
	templateUrl: './launchpad-block.component.html',
	styles: [
		`
			.disabledGradient {
				background: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8));
				transition: background 0.2s ease;
			}

			.gradient {
				background: linear-gradient(165deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.75) 40%, rgba(0, 0, 0, 0) 100%);
				transition: background 0.2s ease;
			}

			/* Blue overlay effect on hover */
			div:hover .gradient {
				background: linear-gradient(
					177deg,
					rgba(1, 82, 140, 0.9) 0%,
					rgba(1, 82, 140, 0.8) 40%,
					rgba(1, 82, 140, 0) 100%
				);
			}

			div img {
				filter: grayscale(100%);
			}

			div:hover img {
				filter: grayscale(0%);
				transform: scale(1.1);
			}

			div:hover .text-box {
				transform: translate(-0.5rem, -0.5rem);
			}
			.lock-icon {
				width: 100%;
				height: 100%;
				position: absolute;
				top: 0;
				left: 0;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		`
	]
})
export class LaunchpadBlockComponent {
	@Input({ required: true }) link!: string;
	@Input() params!: unknown;
	@Input({ required: true }) title!: string;
	@Input({ required: true }) subtitle!: string;
	@Input({ required: true }) img!: string;
	@Input() enabled: boolean | undefined = true;
	@Input() beta: boolean | undefined = false;

	getLink() {
		if (this.params) return [this.link, this.params];
		else return this.link;
	}
}
