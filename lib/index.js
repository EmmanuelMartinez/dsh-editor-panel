import z from "@deepseek-ai/schemastery";
import { FsError, FsVersion } from "@deepseek-ai/dsh-fs";
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
//#region lib/types/index.js
/**
* Workspace document editor: read, stat, and write one Workspace file as
* `workspaceEditor`, so a browser surface can let a person review and edit a
* file themselves instead of handing it to another application.
*
* The Workspace registration is the only directory authority: a request names a
* `WorkspaceId` and a path relative to it, and this service refuses any path
* that resolves outside that root. Writes are version-checked: a caller sends
* back the version it read, so a buffer the Host has moved past is refused
* instead of overwriting newer bytes.
*
* A write here is a person acting on their own machine, not an Agent tool call,
* which is what `writeMode` expresses: it selects the sandbox policy the write
* is performed under, and it defaults to the user's own authority because this
* controller already confines the target to the Workspace it named. Deployments
* that want browser edits confined further set `read-only`, which refuses every
* write while leaving reads intact.
*
* @module @deepseek-ai/dsh-api-workspace-editor
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Modes a browser write may run under. */
const WRITE_MODES = [
	"read-only",
	"workspace-write",
	"danger-full-access"
];
/** The byte text never carries: its presence marks a document as binary. */
const NUL = String.fromCharCode(0);
/**
* Validate one Workspace-relative path from the wire.
* @param path - the path to validate.
* @returns the same path.
* @throws RemoteError with `workspace-editor/outside-workspace` when it is absolute or steps out.
*/
function requireRelativePath(path) {
	if (path === "" || path.includes(NUL) || path.startsWith("/") || path.startsWith("\\") || /^[a-z]:/iu.test(path) || path.split("/").includes("..")) throw new RemoteError("workspace-editor/outside-workspace", `"${path}" is not a workspace-relative path`, { path });
	return path;
}
/** Host Remote owner of the `workspaceEditor` namespace. */
let WorkspaceEditor = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _read_decorators;
	let _stat_decorators;
	let _write_decorators;
	return class WorkspaceEditor extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_read_decorators = [Remote];
			_stat_decorators = [Remote];
			_write_decorators = [Remote];
			__esDecorate(this, null, _read_decorators, {
				kind: "method",
				name: "read",
				static: false,
				private: false,
				access: {
					has: (obj) => "read" in obj,
					get: (obj) => obj.read
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _stat_decorators, {
				kind: "method",
				name: "stat",
				static: false,
				private: false,
				access: {
					has: (obj) => "stat" in obj,
					get: (obj) => obj.stat
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _write_decorators, {
				kind: "method",
				name: "write",
				static: false,
				private: false,
				access: {
					has: (obj) => "write" in obj,
					get: (obj) => obj.write
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		config = __runInitializers(this, _instanceExtraInitializers);
		static inject = [
			"fs",
			"sandboxPolicy",
			"workspaceRegistry"
		];
		static Config = z.object({
			maxFileBytes: z.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER - 1).default(4 * 1024 * 1024),
			writeMode: z.union([...WRITE_MODES]).default("danger-full-access")
		});
		/**
		* @param ctx - Host context carrying the filesystem, the sandbox policy, and the Workspace registry.
		* @param config - the document cap and the write policy.
		*/
		constructor(ctx, config) {
			super(ctx, "workspaceEditor", { namespace: "workspaceEditor" });
			this.config = config;
			if (!Number.isSafeInteger(config.maxFileBytes) || config.maxFileBytes < 1) throw new Error("workspace-editor requires a positive integer maxFileBytes");
			if (!WRITE_MODES.includes(config.writeMode)) throw new Error(`workspace-editor requires writeMode to be one of ${WRITE_MODES.join(", ")}`);
		}
		/**
		* Read one document's complete text and the version a write must send back.
		* @param workspaceId - registered Workspace the path is relative to.
		* @param path - Workspace-relative path of the file to read.
		* @param signal - caller cancellation.
		* @returns the document's text, version, and size.
		* @throws RemoteError when the path is outside the Workspace, is not a regular file, is not text, or exceeds the cap.
		*/
		async read(workspaceId, path, signal) {
			const { target, info } = await this.locate(workspaceId, path, signal);
			if (info.size !== void 0 && info.size > this.config.maxFileBytes) throw this.tooLarge(path);
			let text;
			try {
				text = await this.ctx.fs.readText(target, signal);
			} catch (error) {
				throw this.classify(path, error);
			}
			if (text.includes(NUL)) throw new RemoteError("workspace-editor/not-text", `"${path}" contains NUL bytes`, { path });
			if (Buffer.byteLength(text, "utf8") > this.config.maxFileBytes) throw this.tooLarge(path);
			return {
				...this.statOf(target, info),
				path: this.relative(path),
				text
			};
		}
		/**
		* Report one document's identity and current version without its text.
		* @param workspaceId - registered Workspace the path is relative to.
		* @param path - Workspace-relative path of the file to stat.
		* @param signal - caller cancellation.
		* @returns the document's version and size.
		* @throws RemoteError when the path is outside the Workspace or is not a regular file.
		*/
		async stat(workspaceId, path, signal) {
			const { target, info } = await this.locate(workspaceId, path, signal);
			return {
				...this.statOf(target, info),
				path: this.relative(path)
			};
		}
		/**
		* Write one document's complete text under the caller's expectation.
		* @param workspaceId - registered Workspace the path is relative to.
		* @param path - Workspace-relative path of the file to write.
		* @param text - the complete new text.
		* @param expected - the state the caller read, or a create-only request.
		* @param signal - caller cancellation.
		* @returns the document's new version and size.
		* @throws RemoteError when the path is outside the Workspace, the content exceeds the cap,
		* the expectation no longer holds, or the write policy refuses it.
		*/
		async write(workspaceId, path, text, expected, signal) {
			const { target } = await this.prepare(workspaceId, path, signal);
			if (Buffer.byteLength(text, "utf8") > this.config.maxFileBytes) throw this.tooLarge(path);
			const intent = expected.kind === "createIfAbsent" ? { kind: "createIfAbsent" } : {
				kind: "replaceIfVersion",
				version: FsVersion(expected.version)
			};
			const policy = this.ctx.sandboxPolicy.resolve({ mode: this.config.writeMode });
			try {
				const outcome = await this.ctx.fs.writeText(target, text, intent, signal, policy);
				return {
					path: this.relative(path),
					absolutePath: this.ctx.fs.processPath(target),
					version: outcome.version,
					bytes: Buffer.byteLength(outcome.after, "utf8")
				};
			} catch (error) {
				throw await this.classifyWrite(path, target, error, signal);
			}
		}
		/** The Workspace's canonical directory; the registration is the only path authority. */
		workspaceRoot(workspaceId) {
			const workspace = this.ctx.workspaceRegistry.get(workspaceId);
			if (workspace === void 0) throw new RemoteError("workspace/not-found", `no workspace "${workspaceId}"`, { workspaceId });
			return workspace.path;
		}
		/** Resolve one path and refuse it unless the Workspace contains it. */
		async prepare(workspaceId, path, signal) {
			const root = this.workspaceRoot(workspaceId);
			const workspace = await this.ctx.fs.resolve(root, { signal });
			const target = await this.ctx.fs.resolve(requireRelativePath(path), {
				cwd: root,
				signal
			});
			if (!this.ctx.fs.contains(workspace, target)) throw new RemoteError("workspace-editor/outside-workspace", `"${path}" is outside the workspace`, { path });
			return { target };
		}
		/** Resolve one existing regular file, with the stat that names its version and size. */
		async locate(workspaceId, path, signal) {
			const { target } = await this.prepare(workspaceId, path, signal);
			const entry = await this.ctx.fs.lstat(path, { cwd: this.workspaceRoot(workspaceId) }, signal);
			if (entry === void 0) throw new RemoteError("workspace-editor/not-found", `no entry at "${path}"`, { path });
			if (entry.type !== "file") throw new RemoteError("workspace-editor/not-regular-file", `"${path}" is a ${entry.type}`, {
				path,
				kind: entry.type
			});
			const info = await this.ctx.fs.stat(target, signal);
			if (info === void 0) throw new RemoteError("workspace-editor/not-found", `no entry at "${path}"`, { path });
			if (info.type !== "file") throw new RemoteError("workspace-editor/not-regular-file", `"${path}" is a ${info.type}`, {
				path,
				kind: info.type
			});
			return {
				target,
				info
			};
		}
		statOf(target, info) {
			return {
				absolutePath: this.ctx.fs.processPath(target),
				version: info.version,
				bytes: info.size ?? 0
			};
		}
		/** The wire path: the caller's own spelling, normalized to `/`. */
		relative(path) {
			return path.replace(/\\/g, "/");
		}
		tooLarge(path) {
			return new RemoteError("workspace-editor/too-large", `"${path}" exceeds the ${this.config.maxFileBytes} byte document cap`, {
				path,
				limit: this.config.maxFileBytes
			});
		}
		/** Map a read failure onto the wire vocabulary. */
		classify(path, error) {
			if (errorCodeOf(error) === "FS_NOT_TEXT") return new RemoteError("workspace-editor/not-text", `"${path}" is not UTF-8 text`, { path }, { cause: error });
			return error;
		}
		/**
		* Map a write failure onto the wire vocabulary, reporting the version the file
		* holds now when the caller's expectation was what failed.
		*/
		async classifyWrite(path, target, error, signal) {
			const code = errorCodeOf(error);
			if (code === "FS_STALE_VERSION") {
				const current = await this.ctx.fs.stat(target, signal).catch(() => void 0);
				return new RemoteError("workspace-editor/stale", `"${path}" changed since it was read`, {
					path,
					...current === void 0 ? {} : { current: current.version }
				}, { cause: error });
			}
			if (code === "FS_NOT_OBSERVED") return new RemoteError("workspace-editor/not-observed", `"${path}" already exists`, { path }, { cause: error });
			if (code === "FS_TOO_LARGE") return this.tooLarge(path);
			if (code === "FS_NOT_TEXT") return new RemoteError("workspace-editor/not-text", `"${path}" is not UTF-8 text`, { path }, { cause: error });
			if (error instanceof FsError) return new RemoteError("workspace-editor/write-failed", `cannot write "${path}": ${error.message}`, {
				path,
				code: error.code
			}, { cause: error });
			return error;
		}
	};
})();
/**
* The filesystem error code an error carries, read structurally: the error class
* belongs to whichever `dsh-fs` instance the provider loaded, so no class
* identity is shared across the package boundary.
*/
function errorCodeOf(error) {
	return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : void 0;
}
//#endregion
export { WorkspaceEditor, WorkspaceEditor as default };
