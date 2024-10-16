'use strict';
/**
 * This is test class for PlanningViewService...
 * PlanningView
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../server/server');
const viewResponse = require('./planning-view-response');
const expectedArrayData = viewResponse.getExpectedData();
const partiallyCorrectedArrayData = viewResponse.getPartiallyCorrectedData();

chai.use(chaiHttp);

module.exports = function (validToken) {
	// First test group
	describe('POST => /api/PlanningView/planningViewPlan , should return 200 OK and data with valid token ', () => {
		it('A. PlanningView - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrl)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.params) // Adding params
				.then(res => {
					expect(res).to.have.status(200);
					expect(typeof res).to.equal('object');
					expect(res.headers['content-type']).to.equal(viewResponse.expectedContentType);
					expect(res.headers['content-type']).not.equal(viewResponse.wrongContentType);

					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('B. PlanningView - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrl)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.params) // Adding params
				.then(res => {
					expect(res.body[0].label).to.be.a('string');
					expect(res.body[0].training).to.be.instanceof(Array);
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. PlanningView - Test data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrl)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.params) // Adding params
				.then(res => {
					expect(res.body.sort).to.eql(expectedArrayData.sort);
					expect(res.body[0]).not.eql(partiallyCorrectedArrayData[0]);
					expect(res.body.data).not.eql(viewResponse.wrongData);

					expect(res.body[0].theme[0]).not.null;
					expect(res.body[0].subtheme[0]).to.be.null;
					expect(res.body[0].subtheme[2]).to.be.equal('endurance');
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});
};
