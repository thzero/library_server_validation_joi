import Joi from 'joi';
import { JoiDate } from '@joi/date';
Joi.extend(JoiDate);

import BaseValidationService from '@thzero/library_common_service/service/validation.js';

class JoiBaseValidationService extends BaseValidationService {
	check(correlationId, schema, value, context, prefix) {
		const { error } = schema.validate(value, context);
		return this._validateError(correlationId, error, prefix);
	}

	_validateError(correlationId, error, prefix) {
		if (!error)
			return this._success(correlationId);

		const response = this._error('JoiBaseValidationService', '_validateError', null, null, null, null, correlationId);

		if (error) {
			for (const temp of error.details) {
				response.add(temp.message, temp.context.key, temp.context.key, temp.type, null, prefix);
				this._logger.warn2(null, temp, correlationId);
			}
		}

		return response;
	}

	_boolean = Joi.boolean();
	_dateIso = Joi.date().iso();

	_description = Joi.string()
		.regex(/^[!@#$%^&*()_\-\+=\[\]{}|\\:;"'<>,.?\/a-zA-Z0-9 (\r|\n)*$/)]*$/);

	// Each pattern below is "one alphanumeric, then any run of the wider class".
	// They used to be written [A]+([B]*)*, a starred group inside a star over
	// overlapping classes, which backtracks exponentially on input that does not
	// match: 24 characters took 128ms and 30 took seconds, all on the event loop,
	// from a request body. The single-class form accepts exactly the same strings
	// in linear time. Where a chain has length rules they come before the pattern,
	// so overlong input is rejected by a comparison rather than a scan.
	_extendedNameBase = Joi.string()
		.trim()
		.regex(/^[a-zA-Z0-9]['"._\-a-zA-Z0-9 :;,\(\\+)@]*$/);

	_extendedName = this._extendedNameBase
		.min(3)
		.max(50);

	_email = Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu'] } });

	_externalId = Joi.string()
		.trim()
		.alphanum()
		.min(3)
		.max(30);
	// _id = Joi.string().trim().guid();
	// _id = Joi.string()
	// 	.trim()
	// 	.alphanum()
	// 	.min(20)
	// 	.max(30);
	_id = Joi.string().trim().regex(/^[A-Za-z0-9_-]+$/).min(20).max(30);

	_name = Joi.string()
		.trim()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9]['"._\-a-zA-Z0-9 ]*$/);
	_nameLong = Joi.string()
		.trim()
		.min(3)
		.max(50)
		.regex(/^[a-zA-Z0-9]['"._\-a-zA-Z0-9]*$/);

	_number = Joi.number();

	_roles = Joi.string()
		.trim()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9][_\-a-zA-Z0-9]*$/);

	_tagLine = Joi.string()
		.trim()
		.min(3)
		.max(90)
		.regex(/^[a-zA-Z0-9]['",.!& _\-a-zA-Z0-9 ]*$/)
		.allow('');

	_timestamp = Joi.date().timestamp();

	_url = Joi.string()
		.trim()
		.min(3)
		.max(255)
		.uri();

	_usageMetricsMeasurementType = Joi.string()
		.trim()
		.min(2)
		.max(100)
		.regex(/^[a-zA-Z0-9][._\-a-zA-Z0-9]*$/);

	_username = Joi.string()
		.trim()
		.alphanum()
		.min(3)
		.max(30);
	_userpicture = Joi.string().trim().uri();

	externalIdSchema = this._externalId.required();

	idSchema = this._id.required();

	nameSchema = this._name;

	externalUserSchema = Joi.object({
		id: this._externalId.required(),
		name: this._name.allow(null),
		email: this._email.allow(null),
		picture: this._userpicture.allow(null),
	});

	settingsRefreshSchema = Joi.object({
		userId: this._externalId.required()
	});

	// Built on first use and kept. settingSchema() is the override point for an
	// application's settings shape, and what it composes to does not change, so
	// this used to build a Joi.object and run the subclass concat on every
	// settings update for nothing. Joi schemas are immutable, so one is shareable.
	settingRequestSchema() {
		if (!this._settingRequestSchemaI) {
			this._settingRequestSchemaI = Joi.object({
				userId: this._id.required(),
				settings: this.settingSchema().required()
			});
		}
		return this._settingRequestSchemaI;
	}

	settingSchema() {
		return Joi.object({});
	}

	usageMetricsMeasurementTag = Joi.object({
		type: this._usageMetricsMeasurementType,
		mobile: Joi.boolean().allow(null),
		value: this._number.allow(null)
	});

	usageMetricsMeasurementTagParamsSort = Joi.object({
		id: Joi.string().valid(...[ 'date', 'type', 'value' ]),
		dir: Joi.boolean()
	});

	usageMetricsMeasurementTagParams = Joi.object({
		unit: Joi.string().valid(...[ 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year' ]).allow(null).allow(''),
		number: Joi.number().greater(-1).allow(null),
		date: this._dateIso.allow(null),
		sort: Joi.array().items(this.usageMetricsMeasurementTagParamsSort).allow(null)
	});

	userSchema = Joi.object({
		id: this._externalId.required(),
	});

	userUpdateSchema = Joi.object({
		id: this._externalId.required(),
		email: this._email.allow(null),
		roles: Joi.array().items(this._roles).allow(null),
		updatedTimestamp: this._timestamp.required()
	});
}

export default JoiBaseValidationService;
