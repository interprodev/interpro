import { FunctionalTestInstance, Player, TestMetric } from '@iterpro/shared/data-access/sdk';
import { getEntireTestThreshold, getThresholdsInterval } from '../medical/threshold.functions';
import { getId } from '../utils.functions';

export function getPlayerTestInstances(player: Player, tests: FunctionalTestInstance[], testMetrics: TestMetric[]) {
	const id = getId(player);
	const activeTests = new Map();

	testMetrics.forEach(({ testId, metricLabel, metricName, testName }) => {
		const playerTest = tests.find(
			test =>
				test.testId === testId &&
				test._testResults.some(
					({ playerId, results }) =>
						playerId === id && results.some((result: any) => result.rawField === metricName && Boolean(result.rawValue))
				)
		);

		if (playerTest) {
			const threshold = getEntireTestThreshold(player, metricName, testName);
			const testResult = playerTest._testResults.find(
				({ playerId, results }) =>
					playerId === id && results.some((result: any) => result.rawField === metricName && Boolean(result.rawValue))
			);
			const currentValue = testResult.results.find(
				(result: any) => result.rawField === metricName && Boolean(result.rawValue)
			);

			activeTests.set(metricLabel, {
				label: metricLabel,
				date: playerTest.date,
				testId,
				currentValue: currentValue.rawValue,
				interval: threshold ? getThresholdsInterval(currentValue.rawValue, threshold) : null
			});
		}
	});
	const obj = {};
	activeTests.forEach((value, key) => {
		(obj as any)[key] = value;
	});
	return obj;
}
