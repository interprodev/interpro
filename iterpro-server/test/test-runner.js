'use strict';
const expect = require('chai').expect;
const getValidToken = require('./token.test').getValidToken; // This will make sure that token.test.js file test case will get executed first.

let validToken = null;

/**
 * This is test runner which define all the services and the order of test execution for all the services defined.
 * The test cases includes in this file will get executed after token.test.js file's test cases.
 * The only test case in this file should always pass so that after() hook gets executed with all the service test files.
 */
describe('Test Runner...', () => {
	it('Started...', () => {
		expect(true).to.be.true;
	});

	// The after() hook runs after all(we have only one test case right now.) tests in this describe() block.
	after(function () {
		validToken = getValidToken();

		console.log('Testing with Token = ' + validToken);

		// All these services will get executed with the order defined here as follows...
		require('./admin-dashboard.test')(validToken);
		require('./admin-financial.test')(validToken);
		require('./compare-player.test')(validToken);
		require('./planning-view.test')(validToken);
		require('./players-contracts.test')(validToken);
		require('./profile-players.test')(validToken);
		require('./sessions-stats.test')(validToken);
	});
});
