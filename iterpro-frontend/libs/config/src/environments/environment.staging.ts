import packageInfo from './../../../../package.json';
import { EnvironmentModel } from './environment.interface';

export const environment: EnvironmentModel = {
	version: packageInfo.version,
	production: false,
	name: 'staging',
	CDN_URL: 'https://cdn-staging.iterpro.com',
	BASE_URL: 'https://backendstaging.iterpro.com',
	SOCKET_URL: 'wss://backendstaging.iterpro.com',
	STORAGE_URL: 'https://iterprocdn.blob.core.windows.net',
	HUBSPOT_KB_URL: 'https://support.iterpro.com/en/guide',
	SCHEDULER_LICENSE_KEY: '0729659597-fcs-1713690069',
	TALKJS_API_URL: 'https://api.talkjs.com',
	TALKJS_APP_ID: 'tlOJHsh1',
	mode: 'club',
	MIXPANEL_TOKEN: 'bbfb78f9662b253c6fc718b92bb75a13',
	HOTJAR_CONFIG: {
		trackingCode: 5102363,
		version: 6
	}
};
