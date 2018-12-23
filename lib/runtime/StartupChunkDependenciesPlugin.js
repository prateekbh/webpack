/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/

"use strict";

const RuntimeGlobals = require("../RuntimeGlobals");
const RuntimeModule = require("../RuntimeModule");
const Template = require("../Template");

class StartupChunkDependenciesPlugin {}

class StartupChunkDependenciesRuntimeModule extends RuntimeModule {
	constructor(chunk, chunkGraph) {
		super("startup chunk dependencies");
		this.chunk = chunk;
		this.chunkGraph = chunkGraph;
	}

	generate() {
		const { chunk, chunkGraph } = this;
		const additionalChunksNeeded = new Set();
		for (const pair of chunkGraph.getChunkEntryModulesWithChunkGroupIterable(
			chunk
		)) {
			for (const c of pair[1].chunks) {
				if (c !== chunk) {
					additionalChunksNeeded.add(c);
				}
			}
		}
		return Template.asString([
			`${RuntimeGlobals.delayStartup} = function() {`,
			Template.indent([
				"return Promise.all([",
				Template.indent(
					Array.from(additionalChunksNeeded)
						.map(chunk => {
							return `${RuntimeGlobals.ensureChunk}(${JSON.stringify(
								chunk.id
							)})`;
						})
						.join(",\n")
				),
				"]);"
			]),
			"}"
		]);
	}
}
