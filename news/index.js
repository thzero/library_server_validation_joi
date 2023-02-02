import Joi from 'joi';

import LibraryServerConstants from '@thzero/library_server/constants.js';

import JoiBaseValidationService from '../index.js';

class BaseNewsJoiBaseValidationService extends JoiBaseValidationService {
	getNewsSchema() {
		return this.newsSchema;
	}

	getNewsUpdateSchema() {
		return this.newsUpdateSchema;
	}

	getNewStatus() {
		return LibraryServerConstants.NewsStatus;
	}

	getNewsTypes() {
		return LibraryServerConstants.NewsTypes;
	}

	_newsArticle = Joi.string()
		.regex(/^[!@#$%^&*()_\-\+=\[\]{}|\\:;"'<>,.?\/a-zA-Z0-9 (\r|\n)*$/)]*$/);
	_newsStatus = Joi.string().valid(...Object.values(this.getNewStatus()));
	_newsTitle = Joi.string()
		//.alphanum()
		.regex(/^[a-zA-Z0-9]+(['",.!& _\-a-zA-Z0-9 ]*)*$/)
		.min(3)
		.max(90);
	_newsType = Joi.string().valid(...Object.values(this.getNewsTypes()));

	newsSchema = Joi.object({
		article: this._newsArticle.required(),
		requiresAuth: Joi.boolean(),
		sticky: Joi.boolean(),
		status: this._newsStatus.required(),
		timestamp: this._timestamp.required(),
		title: this._newsTitle.required(),
		type: this._newsType.required()
	});

	newsUpdateSchema = Joi.object({
		id: this._id.required(),
		article: this._newsArticle.required(),
		requiresAuth: Joi.boolean(),
		sticky: Joi.boolean(),
		status: this._newsStatus.required(),
		timestamp: this._timestamp.required(),
		title: this._newsTitle.required(),
		type: this._newsType.required(),
		updatedTimestamp: this._timestamp.required()
	});

	newsTimestampSchema = this._timestamp;//ValidationService._dateIso;
}

export default BaseNewsJoiBaseValidationService;
