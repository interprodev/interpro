import { IterproOrgType } from '@iterpro/shared/data-access/permissions';

export interface EnvironmentModel {
	version: string;
	production: boolean;
	name: string;
	CDN_URL: string;
	BASE_URL: string;
	SOCKET_URL: string;
	STORAGE_URL: string;
	HUBSPOT_KB_URL: string;
	SCHEDULER_LICENSE_KEY: string;
	TALKJS_API_URL: string;
	TALKJS_APP_ID: string;
	mode: IterproOrgType;
	MIXPANEL_TOKEN: string;
	HOTJAR_CONFIG: {
		trackingCode: number;
		version: number;
	};
}
