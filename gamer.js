import Joi from '@hapi/joi';
import JoiDate from '@hapi/joi-date';
Joi.extend(JoiDate);

import JoiBaseValidationService from './index';

class GamerJoiValidationService extends JoiBaseValidationService {
	_gamerId = Joi.string()
		.trim()
		.alphanum();
		//.regex(/^[a-zA-Z0-9]+(['"_\-a-zA-Z0-9]*)*$/);

	_gamerTagFull = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"_\-a-zA-Z0-9 ]*)*$/)
		.min(3)
		.max(30);

	_gamerTagPartial = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"_\-a-zA-Z0-9]*)*$/)
		.min(3)
		.max(30);

	_settingGamerSchema = Joi.object({
		gamerTag: this._gamerTagFull.allow(null).allow(''),
		gamerTagSearch: this._gamerTagFull.allow(null).allow('')
	});

	gamerIdSchema = this._gamerId.required();

	gamerTagSchema = this._gamerTagPartial.required();

	settingRequestSchema() {
		const validation = super.settingRequestSchema();
		return validation.concat(Joi.object({
			settings: this._settingGamerSchema.required()
		}));
	}
}

export default GamerJoiValidationService;
