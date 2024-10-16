import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, Renderer2 } from '@angular/core';
/**
 * @author Adriano Costa <email:adriano.costa@iterpro.com> <github:@wideLandscape>
 * @directive LazyLoadImagesDirective
 * @description
 * This directive handle the lazy loading of images, loading them only when entering the view.
 * The directive should be in a cointainer and the images to lazy load should be declared data-lazy attribute.
 * @example
 * <div iterproLazyLoadImages>
 *  <img [attr.data-lazy]="urlToLazyLoad" />
 *  <img [attr.data-lazy]="anotherUrlToLazyLoad" />
 * </div>
 *
 **/
@Directive({
	standalone: true,
	selector: '[iterproLazyLoadImages]'
})
export class LazyLoadImagesDirective implements AfterViewInit, OnDestroy {
	@Input() lazyOptions: IntersectionObserverInit = {};
	@Input() tag!: string;

	private observer!: IntersectionObserver | undefined;
	private rootElement: Element;
	private observed!: number;

	constructor(element: ElementRef, private renderer: Renderer2) {
		this.rootElement = element.nativeElement;
	}

	ngAfterViewInit() {
		this.observer = new IntersectionObserver(entries => {
			entries.forEach((entry: IntersectionObserverEntry) => {
				if (entry.isIntersecting) {
					this.loadImage(entry);
				}
			});
		}, this.lazyOptions);

		const imagesFoundInDOM = this.getAllImagesToLazyLoad(this.rootElement, this.tag);
		this.observed = imagesFoundInDOM.length;
		imagesFoundInDOM.forEach(item => {
			this.observer?.observe(item);
		});
	}

	ngOnDestroy() {
		if (this.observer) {
			this.destroyObserver();
		}
	}

	private loadImage(entry: IntersectionObserverEntry) {
		this.renderer.setAttribute(entry.target, 'src', (entry.target as HTMLImageElement).dataset['lazy'] as string);
		this.renderer.removeAttribute(entry.target, 'data-lazy');
		this.observer?.unobserve(entry.target);
		this.observed--;
		if (this.observed === 0) {
			this.destroyObserver();
		}
	}

	private destroyObserver() {
		this.observer?.disconnect();
		this.observer = undefined;
	}

	private getAllImagesToLazyLoad(pageNode: Element, tag = 'img') {
		return Array.from(pageNode.querySelectorAll(`${tag}[data-lazy]`));
	}
}
