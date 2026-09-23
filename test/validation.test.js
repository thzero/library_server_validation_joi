import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import Joi from 'joi';

import '@thzero/library_common/utility/string.js';
import JoiBaseValidationService from '../index.js';
import GamerJoiValidationService from '../gamer.js';

const inject = (target, name, value) => {
	Object.defineProperty(target, name, { value, writable: true, configurable: true });
	return target;
};

let service;
let warnings;

beforeEach(() => {
	service = new JoiBaseValidationService();
	warnings = [];
	inject(service, '_logger', {
		debug() {}, info() {}, error() {}, exception() {}, fatal() {}, trace() {},
		warn() {}, warn2(message, data, correlationId) { warnings.push({ message, data, correlationId }); }
	});
	inject(service, '_config', { get: () => null });
});

describe('check', () => {
	const schema = Joi.object({ name: Joi.string().min(3).required(), age: Joi.number().required() });

	it('succeeds on a valid value', () => {
		const response = service.check('cid', schema, { name: 'abc', age: 1 });
		assert.equal(service._hasSucceeded(response), true);
	});

	it('fails on an invalid value and carries the correlationId', () => {
		const response = service.check('cid-123', schema, { name: 'a', age: 1 });
		assert.equal(service._hasFailed(response), true);
		assert.equal(response.correlationId, 'cid-123');
	});

	// Regression: the destructure read `{ error, valueO }`, and Joi returns
	// `{ value, error }` - so valueO was always undefined and never used.
	// check() only ever cared about the error, which is what this pins.
	it('reports only the error, never a sanitised value', () => {
		const response = service.check('cid', Joi.object({ name: Joi.string().trim() }), { name: '  abc  ' });
		assert.equal(service._hasSucceeded(response), true);
		assert.equal(response.results, null, 'check does not hand back the coerced value');
	});

	it('records one error entry per failing field', () => {
		const response = service.check('cid', schema, { name: 'a' });
		assert.ok(Array.isArray(response.errors));
		assert.ok(response.errors.length >= 1);
	});

	it('passes a context through to Joi', () => {
		const strict = Joi.object({ name: Joi.string() });
		assert.equal(service._hasFailed(service.check('cid', strict, { name: 'a', extra: 1 })), true);
		assert.equal(service._hasSucceeded(service.check('cid', strict, { name: 'a', extra: 1 }, { allowUnknown: true })), true);
	});
});

describe('_validateError', () => {
	it('succeeds when there is no error', () => {
		assert.equal(service._hasSucceeded(service._validateError('cid', null)), true);
	});

	// Regression: warn2 is warn2(message, data, correlationId, isClient) and the
	// correlationId was left off, so the warning could not be tied to its request.
	it('logs each detail with the correlationId', () => {
		const schema = Joi.object({ name: Joi.string().min(3).required() });
		service.check('cid-123', schema, { name: 'a' });
		assert.ok(warnings.length >= 1, 'a warning was logged');
		for (const warning of warnings)
			assert.equal(warning.correlationId, 'cid-123');
	});
});

describe('shared schemas', () => {
	it('idSchema accepts a generated id and rejects a short one', () => {
		assert.equal(service._hasSucceeded(service.check('cid', service.idSchema, 'abcdefghij0123456789')), true);
		assert.equal(service._hasFailed(service.check('cid', service.idSchema, 'short')), true);
		assert.equal(service._hasFailed(service.check('cid', service.idSchema, null)), true);
	});

	it('externalUserSchema requires an id and allows null optional fields', () => {
		assert.equal(service._hasSucceeded(service.check('cid', service.externalUserSchema,
			{ id: 'abc123', name: null, email: null, picture: null })), true);
		assert.equal(service._hasFailed(service.check('cid', service.externalUserSchema, { name: 'someone' })), true);
	});

	it('externalUserSchema rejects an unusable email', () => {
		assert.equal(service._hasFailed(service.check('cid', service.externalUserSchema,
			{ id: 'abc123', email: 'not-an-email' })), true);
	});

	it('userUpdateSchema requires an updatedTimestamp', () => {
		assert.equal(service._hasFailed(service.check('cid', service.userUpdateSchema, { id: 'abc123' })), true);
		assert.equal(service._hasSucceeded(service.check('cid', service.userUpdateSchema,
			{ id: 'abc123', updatedTimestamp: Date.now() })), true);
	});

	it('usageMetricsMeasurementTagParams constrains the unit', () => {
		assert.equal(service._hasSucceeded(service.check('cid', service.usageMetricsMeasurementTagParams, { unit: 'day' })), true);
		assert.equal(service._hasFailed(service.check('cid', service.usageMetricsMeasurementTagParams, { unit: 'fortnight' })), true);
	});
});

describe('settingRequestSchema', () => {
	const userId = 'abcdefghij0123456789';

	// It used to build a new Joi.object, and run the subclass concat inside it,
	// on every settings update.
	it('is built once and reused', () => {
		let composed = 0;
		class Counting extends JoiBaseValidationService {
			settingSchema() { composed++; return super.settingSchema(); }
		}
		const counting = new Counting();
		const first = counting.settingRequestSchema();
		assert.equal(counting.settingRequestSchema(), first);
		assert.equal(counting.settingRequestSchema(), first);
		assert.equal(composed, 1);
	});

	it('composes the settings shape the subclass provides', () => {
		const gamer = new GamerJoiValidationService();
		inject(gamer, '_logger', { warn2() {} });
		const schema = gamer.settingRequestSchema();
		assert.equal(gamer._hasSucceeded(gamer.check('cid', schema, { userId, settings: { gamerTag: 'player.one' } })), true);
		assert.equal(gamer._hasFailed(gamer.check('cid', schema, { userId, settings: { gamerTag: 'no spaces here' } })), true);
	});

	it('on the base, accepts no settings keys at all', () => {
		const schema = service.settingRequestSchema();
		assert.equal(service._hasSucceeded(service.check('cid', schema, { userId, settings: {} })), true);
		assert.equal(service._hasFailed(service.check('cid', schema, { userId, settings: { gamerTag: 'x' } })), true);
	});

	it('each instance keeps its own', () => {
		const base = new JoiBaseValidationService();
		const gamer = new GamerJoiValidationService();
		assert.notEqual(base.settingRequestSchema(), gamer.settingRequestSchema());
	});
});
