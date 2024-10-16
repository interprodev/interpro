export interface DeviceMetricDescriptorInterface {
	metricName: string;
	metricLabel: string;
	algo: boolean;
	defaultValue: number;
}

export interface TestMetric {
	metricLabel: string;
	testName: string;
	metricName: string;
	testId: string;
	purpose: string[];
	active?: boolean;
}

export class DeviceMetricDescriptor implements DeviceMetricDescriptorInterface {
	metricName: string;
	metricLabel: string;
	algo: boolean;
	defaultValue: number;

	constructor(data: DeviceMetricDescriptorInterface) {
		this.metricName = data?.metricName;
		this.metricLabel = data?.metricLabel;
		this.algo = data?.algo;
		this.defaultValue = data?.defaultValue;
	}
}
