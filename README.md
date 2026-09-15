![GitHub package.json version](https://img.shields.io/github/package-json/v/thzero/library_server_validation_joi)
![David](https://img.shields.io/david/thzero/library_server_validation_joi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# library_server_validation_joi

The [Joi](https://joi.dev) backed validation service for [@thzero/library_server](https://github.com/thzero/library_server).

Implements the framework's validation contract and ships the schemas the library's own services validate against, so an application only writes schemas for its own entities.

## Requirements

### NodeJs

[NodeJs](https://nodejs.org) version 22+

### Installation

[![NPM](https://nodei.co/npm/@thzero/library_server_validation_joi.png?compact=true)](https://npmjs.org/package/@thzero/library_server_validation_joi)

```
npm install @thzero/library_server_validation_joi
```

#### Peer dependencies

* `@thzero/library_common`
* `@thzero/library_common_service`
* `@thzero/library_server`

[@joi/date](https://github.com/hapijs/joi-date) is registered onto Joi by this package, so `Joi.date().format(...)` is available to your schemas too.

## What it provides

### `index.js` — `JoiBaseValidationService`

| Method | Purpose |
|---|---|
| `check(correlationId, schema, value, context, prefix)` | Validates `value` against `schema`. Returns a success response, or an error response with one entry per failing field. `context` is passed to Joi as its options — `{ allowUnknown: true }`, for example. |
| `_validateError(correlationId, error, prefix)` | Turns a Joi error into the framework's error response. Each detail is also logged as a warning against the correlationId. |

`check` reports **only** the error. Joi's coerced value is not returned, so a schema that trims or casts does not hand the cleaned value back to the caller — validate, then use your own value.

### Reusable field schemas

Building blocks for an application's own schemas, all protected members:

`_boolean`, `_dateIso`, `_description`, `_email`, `_extendedName`, `_extendedNameBase`, `_externalId`, `_id`, `_name`, `_nameLong`, `_number`, `_roles`, `_tagLine`, `_timestamp`, `_url`, `_usageMetricsMeasurementType`, `_username`, `_userpicture`

`_id` matches the framework's generated id shape — 20 to 30 characters of `A-Za-z0-9_-`.

### Entity schemas

| Schema | Used for |
|---|---|
| `idSchema`, `externalIdSchema`, `nameSchema` | Single-value checks |
| `externalUserSchema` | The user as the identity provider supplies it — id required, name, email and picture nullable |
| `userSchema`, `userUpdateSchema` | Users. `userUpdateSchema` requires `updatedTimestamp`, which is what drives the framework's concurrency check |
| `settingsRefreshSchema`, `settingRequestSchema()`, `settingSchema()` | User settings. Override `settingSchema()` to describe your application's settings |
| `usageMetricsMeasurementTag`, `usageMetricsMeasurementTagParams`, `usageMetricsMeasurementTagParamsSort` | Usage metrics |

### `news/index.js` — `BaseNewsJoiBaseValidationService`

Adds the news schemas: `getNewsSchema`, `getNewsUpdateSchema`, `getNewStatus`, `getNewsTypes`.

### `gamer.js` — `GamerJoiValidationService`

Adds gamer tag schemas: `settingGamerTagSchema`, `settingGamerTagDisplaySchema`, `settingGamerTagSearchSchema`, and a `settingSchema` override.

## Configuration

None. This package reads no configuration.

## Wiring it up

Subclass it, add your schemas, and register the subclass under `SERVICE_VALIDATION`:

```js
import JoiBaseValidationService from '@thzero/library_server_validation_joi/index.js';

class AppValidationService extends JoiBaseValidationService {
    partSchema = Joi.object({
        id: this._id.required(),
        name: this._name.required(),
        manufacturerId: this._id.allow(null)
    });

    settingSchema() {
        return Joi.object({ measurementUnits: Joi.string().allow(null) });
    }
}
```

Then use it from a service:

```js
const validationResponse = this._serviceValidation.check(correlationId, this._serviceValidation.partSchema, part);
if (this._hasFailed(validationResponse))
    return validationResponse;
```

The framework's own services resolve `SERVICE_VALIDATION` and expect the library schemas above to be present, so subclass rather than replace.

## Development

```
npm run lint       # eslint .
npm run lint:fix   # eslint . --fix
npm test           # node --test "test/*.test.js"
```
