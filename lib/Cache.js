/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const { AsyncParallelHook, AsyncSeriesBailHook, SyncHook } = require("tapable");

/** @typedef {import("./WebpackError")} WebpackError */

/**
 * @template T
 * @callback Callback
 * @param {WebpackError=} err
 * @param {T=} stats
 * @returns {void}
 */

class Cache {
	constructor() {
		this.hooks = {
			/** @type {AsyncSeriesBailHook<[string, string], unknown>} */
			get: new AsyncSeriesBailHook(["identifier", "etag"]),
			/** @type {AsyncParallelHook<[string, string, unknown]>} */
			store: new AsyncParallelHook(["identifier", "etag", "data"]),
			/** @type {SyncHook<[]>} */
			beginIdle: new SyncHook([]),
			/** @type {AsyncParallelHook<[]>} */
			endIdle: new AsyncParallelHook([]),
			/** @type {AsyncParallelHook<[]>} */
			shutdown: new AsyncParallelHook([])
		};
	}

	/**
	 * @template T
	 * @param {string} identifier the cache identifier
	 * @param {string} etag the etag
	 * @param {Callback<T>} callback signals when the value is retrieved
	 * @returns {void}
	 */
	get(identifier, etag, callback) {
		this.hooks.get.callAsync(identifier, etag, callback);
	}

	/**
	 * @template T
	 * @param {string} identifier the cache identifier
	 * @param {string} etag the etag
	 * @param {T} data the value to store
	 * @param {Callback<void>} callback signals when the value is stored
	 * @returns {void}
	 */
	store(identifier, etag, data, callback) {
		this.hooks.store.callAsync(identifier, etag, data, callback);
	}

	/**
	 * @returns {void}
	 */
	beginIdle() {
		this.hooks.beginIdle.call();
	}

	/**
	 * @param {Callback<void>} callback signals when the call finishes
	 * @returns {void}
	 */
	endIdle(callback) {
		this.hooks.endIdle.callAsync(callback);
	}

	/**
	 * @param {Callback<void>} callback signals when the call finishes
	 * @returns {void}
	 */
	shutdown(callback) {
		this.hooks.shutdown.callAsync(callback);
	}
}

module.exports = Cache;
