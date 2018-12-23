/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const RuntimeGlobals = require("../RuntimeGlobals");
const NodeChunkTemplatePlugin = require("./NodeChunkTemplatePlugin");
const ReadFileChunkLoadingRuntimeModule = require("./ReadFileChunkLoadingRuntimeModule");
const RequireChunkLoadingRuntimeModule = require("./RequireChunkLoadingRuntimeModule");

/** @typedef {import("../Compiler")} Compiler */

class NodeTemplatePlugin {
	constructor(options) {
		options = options || {};
		this.asyncChunkLoading = options.asyncChunkLoading;
	}

	/**
	 * @param {Compiler} compiler the compiler instance
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.thisCompilation.tap("NodeTemplatePlugin", compilation => {
			new NodeChunkTemplatePlugin(compilation).apply(compilation.chunkTemplate);

			const onceForChunkSet = new WeakSet();
			const handler = (chunk, set) => {
				if (onceForChunkSet.has(chunk)) return;
				onceForChunkSet.add(chunk);
				set.add(RuntimeGlobals.moduleFactories);
				if (this.asyncChunkLoading) {
					compilation.addRuntimeModule(
						chunk,
						new ReadFileChunkLoadingRuntimeModule(chunk, set)
					);
				} else {
					compilation.addRuntimeModule(
						chunk,
						new RequireChunkLoadingRuntimeModule(
							chunk,
							compilation.chunkGraph,
							set
						)
					);
				}
			};

			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.ensureChunkHandlers)
				.tap("NodeTemplatePlugin", handler);
			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.startup)
				.tap("NodeTemplatePlugin", handler);
			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.hmrDownloadUpdateHandlers)
				.tap("NodeTemplatePlugin", handler);
			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.hmrDownloadManifest)
				.tap("NodeTemplatePlugin", handler);

			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.ensureChunkHandlers)
				.tap("NodeTemplatePlugin", (chunk, set) => {
					set.add(RuntimeGlobals.getChunkScriptFilename);
				});
			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.hmrDownloadUpdateHandlers)
				.tap("NodeTemplatePlugin", (chunk, set) => {
					set.add(RuntimeGlobals.getChunkUpdateScriptFilename);
					set.add(RuntimeGlobals.moduleCache);
					set.add(RuntimeGlobals.hmrModuleData);
					set.add(RuntimeGlobals.moduleFactories);
				});
			compilation.hooks.runtimeRequirementInTree
				.for(RuntimeGlobals.hmrDownloadManifest)
				.tap("NodeTemplatePlugin", (chunk, set) => {
					set.add(RuntimeGlobals.getUpdateManifestFilename);
				});
			compilation.hooks.additionalTreeRuntimeRequirements.tap(
				"NodeTemplatePlugin",
				(chunk, set) => {
					const additionalChunksNeeded = new Set();
					for (const [
						module,
						chunkGroup
					] of compilation.chunkGraph.getChunkEntryModulesWithChunkGroupIterable(
						chunk
					)) {
						for (const c of chunkGroup.chunks) {
							if (c !== chunk) {
								additionalChunksNeeded.add(c);
							}
						}
					}
					if (additionalChunksNeeded.size > 0) {
						set.add(RuntimeGlobals.delayStartup);
						set.add(RuntimeGlobals.ensureChunk);
						set.add(RuntimeGlobals.ensureChunkIncludeEntries);
					}
				}
			);
		});
	}
}

module.exports = NodeTemplatePlugin;
