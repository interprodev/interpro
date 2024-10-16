interface GuideContent {
	title: string;
	tags: string[];
}

interface LocalizedContent {
	[lang: string]: GuideContent;
}

export interface GuideItem {
	content: LocalizedContent;
	url: string;
	path?: string;
	section?: string;
	order?: number;
	sections?: GuideItem[];
	articles?: GuideItem[];
	related?: string[];
}

export interface GuideRoute {
	item: GuideItem;
	parent: GuideItem;
	breadcrumb: GuideItem[];
	section: string;
}

export interface GuideRoutes {
	[url: string]: GuideRoute;
}
