import Joi from 'joi';
import JoiDate from '@joi/date';
Joi.extend(JoiDate);

import JoiBaseValidationService from './index.js';

class GamerJoiValidationService extends JoiBaseValidationService {
	_gamerId = Joi.string()
		.trim()
		.alphanum();
		//.regex(/^[a-zA-Z0-9]+(['"_\-a-zA-Z0-9]*)*$/);

	_gamerTagDisplay = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"_\-=\.,a-zA-Z0-9 ]*)*$/)
		.min(3)
		.max(30);

	_gamerTagFull = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+([_\-\.a-zA-Z0-9]*)*$/)
		.min(3)
		.max(30);

	_gamerTagPartial = Joi.string()
		.trim()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['"_\-=\.,a-zA-Z0-9 ]*)*$/)
		.min(3)
		.max(30);

	_settingGamerSchema = Joi.object({
		// gamerTag: this._gamerTagFull.allow(null).allow(''),
		// gamerTagDisplay: this._gamerTagDisplay.allow(null).allow(''),
		// gamerTagSearch: this._gamerTagDisplay.allow(null).allow('')
		gamerTag: this.settingGamerTagSchema(),
		gamerTagDisplay: this.settingGamerTagDisplaySchema(),
		gamerTagSearch: this.settingGamerTagSearchSchema()
	});

	gamerIdSchema = this._gamerId.required();

	gamerTagSchema = this._gamerTagFull.required();

	settingGamerTagSchema() {
		return this._gamerTagFull.allow(null).allow('');
	}

	settingGamerTagDisplaySchema() {
		return this._gamerTagDisplay.allow(null).allow('');
	}

	settingGamerTagSearchSchema() {
		return this._gamerTagDisplay.allow(null).allow('');
	}

	settingSchema() {
		const validation = super.settingSchema();
		return validation.concat(this._settingGamerSchema);
	}
}

export default GamerJoiValidationService;
