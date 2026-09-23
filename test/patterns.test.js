import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import '@thzero/library_common/utility/string.js';
import JoiBaseValidationService from '../index.js';
import GamerJoiValidationService from '../gamer.js';
import BaseNewsJoiBaseValidationService from '../news/index.js';

const base = new JoiBaseValidationService();
const gamer = new GamerJoiValidationService();
const news = new BaseNewsJoiBaseValidationService();

const accepts = (schema, value) => !schema.validate(value).error;
const failureType = (schema, value) => {
	const { error } = schema.validate(value);
	return error ? error.details[0].type : null;
};

// The patterns used to be written [A]+([B]*)*: a starred group inside a star,
// over classes that overlap. On input that does not match, the engine tries
// every way of splitting the run between the inner and outer stars before
// giving up, which is exponential in the length: 24 characters took 128ms,
// and 30 (the max on most of these) took seconds, on the event loop, from a
// request body. Each entry keeps its old pattern so the rewrite can be shown
// to accept exactly the same strings.
//
// `lengthFirst` marks chains that own their length rules and run them before
// the pattern. _extendedName inherits its pattern from _extendedNameBase, which
// has no length rule of its own, so its pattern still runs first.
const schemas = [
	{
		name: '_extendedName', schema: base._extendedName, min: 3, max: 50, lengthFirst: false,
		old: /^[a-zA-Z0-9]+(['"._\-a-zA-Z0-9 :;,\(\\+)@]*)*$/,
		alphabet: `abcAZ09'"._- :;,(\\+)@`,
		accepted: [ 'abc', "O'Neil, Jr.", 'a (b) + c @ d; e: f' ],
		rejected: [ '-abc', "'abc", 'a#b', 'a/b' ]
	},
	{
		name: '_name', schema: base._name, min: 3, max: 30, lengthFirst: true,
		old: /^[a-zA-Z0-9]+(['"._\-a-zA-Z0-9 ]*)*$/,
		alphabet: `abcAZ09'"._- `,
		accepted: [ 'abc', 'John Doe', "O'Brien", 'a.b-c_d', 'x "y" z' ],
		rejected: [ '-abc', '.abc', 'a,b', 'a#b', 'a:b' ]
	},
	{
		name: '_nameLong', schema: base._nameLong, min: 3, max: 50, lengthFirst: true,
		old: /^[a-zA-Z0-9]+(['"._\-a-zA-Z0-9]*)*$/,
		alphabet: `abcAZ09'"._-`,
		accepted: [ 'abc', "O'Brien", 'a.b-c_d' ],
		rejected: [ 'a b', '-abc', 'a,b', 'a#b' ]
	},
	{
		name: '_roles', schema: base._roles, min: 3, max: 30, lengthFirst: true,
		old: /^[a-zA-Z0-9]+([_\-a-zA-Z0-9]*)*$/,
		alphabet: 'abcAZ09_-',
		accepted: [ 'abc', 'admin', 'user_read-only' ],
		rejected: [ 'a b', '_abc', 'a.b', "a'b", 'a#b' ]
	},
	{
		name: '_tagLine', schema: base._tagLine, min: 3, max: 90, lengthFirst: true,
		old: /^[a-zA-Z0-9]+(['",.!& _\-a-zA-Z0-9 ]*)*$/,
		alphabet: `abcAZ09'",.!& _-`,
		accepted: [ 'abc', 'Hello, world!', 'Rock & Roll', "It's a tag-line." ],
		rejected: [ '!abc', 'a:b', 'a#b', 'a(b)' ]
	},
	{
		name: '_usageMetricsMeasurementType', schema: base._usageMetricsMeasurementType, min: 2, max: 100, lengthFirst: true,
		old: /^[a-zA-Z0-9]+([._\-a-zA-Z0-9]*)*$/,
		alphabet: 'abcAZ09._-',
		accepted: [ 'ab', 'page.view', 'app_start-cold' ],
		rejected: [ 'a b', '.ab', "a'b", 'a#b' ]
	},
	{
		name: '_gamerTagDisplay', schema: gamer._gamerTagDisplay, min: 3, max: 30, lengthFirst: true,
		old: /^[a-zA-Z0-9]+(['"_\-=\.,a-zA-Z0-9 ]*)*$/,
		alphabet: `abcAZ09'"_-=., `,
		accepted: [ 'abc', 'Player One', 'x=y', "a'b, c." ],
		rejected: [ '=abc', 'a:b', 'a#b', 'a(b)' ]
	},
	{
		name: '_gamerTagFull', schema: gamer._gamerTagFull, min: 3, max: 30, lengthFirst: true,
		old: /^[a-zA-Z0-9]+([_\-\.a-zA-Z0-9]*)*$/,
		alphabet: 'abcAZ09_-.',
		accepted: [ 'abc', 'player.one', 'a_b-c' ],
		rejected: [ 'a b', '.abc', "a'b", 'a=b', 'a#b' ]
	},
	{
		name: '_gamerTagPartial', schema: gamer._gamerTagPartial, min: 3, max: 30, lengthFirst: true,
		old: /^[a-zA-Z0-9]+(['"_\-=\.,a-zA-Z0-9 ]*)*$/,
		alphabet: `abcAZ09'"_-=., `,
		accepted: [ 'abc', 'Player One', 'x=y' ],
		rejected: [ '=abc', 'a:b', 'a#b' ]
	},
	{
		name: '_newsTitle', schema: news._newsTitle, min: 3, max: 90, lengthFirst: true,
		old: /^[a-zA-Z0-9]+(['",.!& _\-a-zA-Z0-9 ]*)*$/,
		alphabet: `abcAZ09'",.!& _-`,
		accepted: [ 'abc', 'Hello, world!', 'Q & A' ],
		rejected: [ '!abc', 'a:b', 'a#b' ]
	}
];

// Deterministic, so a disagreement reproduces. Park-Miller: the product stays
// under 2^53, so the arithmetic is exact.
const random = (seed) => () => {
	seed = (seed * 48271) % 2147483647;
	return seed / 2147483647;
};

// Short strings over the class alphabet plus a few outsiders, so both the
// accepted and the rejected side get exercised. Kept short: the old pattern
// is the one being run here, and it is the one that blows up on length.
const samples = (alphabet, min, max, count) => {
	const next = random(alphabet.length * 7919);
	const chars = alphabet + '#:/';
	const results = [];
	while (results.length < count) {
		const length = min + Math.floor(next() * (Math.min(max, 8) - min + 1));
		let value = '';
		for (let i = 0; i < length; i++)
			value += chars[Math.floor(next() * chars.length)];
		// The schemas trim, so a sample with edge whitespace would be compared
		// against a different string than the one the old pattern sees. (The
		// same reason a leading space is not among the rejected samples above.)
		if (value.trim() !== value)
			continue;
		results.push(value);
	}
	return results;
};

for (const entry of schemas) {
	describe(entry.name, () => {
		it('accepts what it should', () => {
			for (const value of entry.accepted)
				assert.equal(accepts(entry.schema, value), true, `${entry.name} rejected ${JSON.stringify(value)}`);
		});

		it('rejects what it should', () => {
			for (const value of entry.rejected)
				assert.equal(accepts(entry.schema, value), false, `${entry.name} accepted ${JSON.stringify(value)}`);
		});

		it('accepts exactly the strings the old pattern did', () => {
			for (const value of samples(entry.alphabet, entry.min, entry.max, 300)) {
				const expected = entry.old.test(value);
				assert.equal(accepts(entry.schema, value), expected,
					`${entry.name} disagrees with the old pattern on ${JSON.stringify(value)}: old ${expected}`);
			}
		});

		it('rejects a near-max non-matching value without stalling', () => {
			// One under the max, so the length rule passes and the pattern is what
			// runs. The old pattern took seconds at 30 and would never return at 90.
			const value = 'a'.repeat(entry.max - 1) + '#';
			const started = Date.now();
			assert.equal(accepts(entry.schema, value), false);
			const elapsed = Date.now() - started;
			assert.ok(elapsed < 100, `${entry.name} took ${elapsed}ms on ${entry.max - 1} characters`);
		});

		if (entry.lengthFirst) {
			it('rejects overlong input on length, before the pattern runs', () => {
				const value = 'a'.repeat(entry.max + 1) + '#';
				assert.equal(failureType(entry.schema, value), 'string.max');
			});

			it('rejects short input on length, before the pattern runs', () => {
				assert.equal(failureType(entry.schema, '#'), 'string.min');
			});
		}
	});
}
