export type SideMenu = {
	label: string;
	badgeIcon?: {
		icon: string;
		tooltip: string;
	};
	routerLink: string[];
	disabled?: boolean;
	icon?: string;
	items?: SideMenu[];
}
