'use strict';
/**
 * Sending login request to the app to receive valid token
 * value before calling all other test cases.
 *
 * The test cases includes in this file will get executed first.
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../server/server');
chai.use(chaiHttp);

let tokenId = null;

/**
 * refer /test/.env.test.js file for credential values.
 */
const credentials = {
	email: process.env.TEST_USERNAME,
	password: process.env.TEST_PASSWORD
};

// 1st test group
describe('Login => Get Valid Token', () => {
	it('A. Before calling other api this should save a token value with 200 OK', done => {
		//sending login request to the app to receive valid token id.
		chai
			.request(app)
			.post('/api/customers/login')
			.send(credentials)
			.then(res => {
				expect(res).to.have.status(200); // 200 OK
				expect(res.body.id).to.exist; // Valid token exist
				expect(res.body.userId).to.exist; // Valid user exist
				expect(res.unauthorized).to.be.equal(false);
				expect(res.headers['content-type']).to.exist; // Valid content type exist
				expect(res.error).to.be.equal(false);

				tokenId = res.body.id; // storing token to call api's in future
				done(); // chai.request() launch async requests and will not be completed until we manually indicate it by calling done() at the end.
			})
			.catch(err => {
				console.log(err.message);
			});
	});

	// The after() hook runs after all(we have only one test case right now.) tests in this describe() block.
	// This will make sure after above test execution tokenId filled with valid token value.
	after(function () {
		tokenId = getValidToken();
	});
});

// Return a valid token after successful login.
function getValidToken() {
	return tokenId;
}
module.exports.getValidToken = getValidToken;
