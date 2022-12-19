import Joi from 'joi';
import JoiDate from '@joi/date';
Joi.extend(JoiDate);

import BaseValidationService from '@thzero/library_common_service/service/validation.js';

class JoiBaseValidationService extends BaseValidationService {
	check(correlationId, schema, value, context, prefix) {
		const { error, valueO } = schema.validate(value, context);
		return this._validateError(correlationId, error, prefix);
	}

	_validateError(correlationId, error, prefix) {
		if (!error)
			return this._success(correlationId);

		const response = this._error('JoiBaseValidationService', '_validateError', null, null, null, null, correlationId);

		if (error) {
			for (const temp of error.details) {
				response.add(temp.message, temp.context.key, temp.context.key, temp.type, null, prefix);
				this._logger.warn2(null, temp);
			}
		}

		return response;
	}

	_boolean = Joi.boolean();
	_dateIso = Joi.date().iso();

	_description = Joi.string()
		.regex(/^[!@#$%^&*()_\-\+=\[\]{}|\\:;"'<>,.?\/a-zA-Z0-9 (\r|\n)*$/)]*$/);

	_extendedName = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"._\-a-zA-Z0-9 :;,\(\)]*)*$/)
		.min(3)
		.max(50);

	_email = Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu'] } });

	_externalId = Joi.string()
		.trim()
		.alphanum()
		.min(3)
		.max(30);
	// _id = Joi.string().trim().guid();
	_id = Joi.string()
		.trim()
		.alphanum()
		.min(20)
		.max(30);

	_name = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"._\-a-zA-Z0-9 ]*)*$/)
		.min(3)
		.max(30);
	_nameLong = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"._\-a-zA-Z0-9]*)*$/)
		.min(3)
		.max(50);

	_number = Joi.number();

	_roles = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+([_\-a-zA-Z0-9]*)*$/)
		.min(3)
		.max(30);

	_tagLine = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['",.!& _\-a-zA-Z0-9 ]*)*$/)
		.min(3)
		.max(90)
		.allow('');

	_timestamp = Joi.date().timestamp();

	_url = Joi.string()
		.trim()
		.min(3)
		.uri();

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

	settingRequestSchema() {
		return Joi.object({
			userId: this._id.required(),
			settings: this.settingSchema().required()
		});
	}

	settingSchema() {
		return Joi.object({});
	}

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
