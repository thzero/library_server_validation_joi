import Joi from 'joi';
import { JoiDate } from '@joi/date';
Joi.extend(JoiDate);

import JoiBaseValidationService from './index.js';

class GamerJoiValidationService extends JoiBaseValidationService {
	_gamerId = Joi.string()
		.trim()
		.alphanum();
		//.regex(/^[a-zA-Z0-9]+(['"_\-a-zA-Z0-9]*)*$/);

	// Single-class patterns with the length rules first; see the note on
	// _extendedNameBase in index.js for why the [A]+([B]*)* form had to go.
	_gamerTagDisplay = Joi.string()
		.trim()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9]['"_\-=\.,a-zA-Z0-9 ]*$/);

	_gamerTagFull = Joi.string()
		.trim()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9][_\-\.a-zA-Z0-9]*$/);

	_gamerTagPartial = Joi.string()
		.trim()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9]['"_\-=\.,a-zA-Z0-9 ]*$/);

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
