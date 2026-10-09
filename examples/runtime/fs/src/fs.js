import {closeSync, mkdir, mkdirSync, openSync, readFile, readFileSync, readSync, rename, renameSync, unlink, unlinkSync, writeFile, writeFileSync, rmSync, symlinkSync, existsSync, lstatSync} from "node:fs";
import {cwd, argv, env} from "node:process";
import {env as env2} from "process"; // validating that node:process is also registered as 'process'
import * as fsPromises from "node:fs/promises";
import {Buffer} from "node:buffer";

export const testReadSyncBulkCopy = () => {
    const path = '/test/read-sync-bulk-copy.bin';
    const source = Buffer.alloc(131103);
    for (let i = 0; i < source.length; i++) source[i] = i % 251;
    writeFileSync(path, source);
    const fd = openSync(path, 'r');
    try {
        for (const target of [Buffer.alloc(80, 0x55).subarray(5, 60),
            new Uint8Array(new ArrayBuffer(80), 5, 55),
            new Int8Array(new ArrayBuffer(80), 5, 55),
            new Uint8ClampedArray(new ArrayBuffer(80), 5, 55),
            new Uint16Array(new ArrayBuffer(120), 6, 27),
            new DataView(new ArrayBuffer(80), 5, 55)]) {
            const targetBytes = new Uint8Array(target.buffer, target.byteOffset, target.byteLength);
            targetBytes.fill(0x55);
            if (readSync(fd, target, 3, 21, 17) !== 21) throw new Error('read count');
            for (let i = 0; i < targetBytes.length; i++) {
                const expected = i >= 3 && i < 24 ? source[17 + i - 3] : 0x55;
                if (targetBytes[i] !== expected) throw new Error('offset or sentinel mismatch');
            }
            targetBytes.fill(0x55);
            if (readSync(fd, target, {offset: 2, length: 30, position: source.length - 7}) !== 7) throw new Error('partial read count');
            for (let i = 0; i < targetBytes.length; i++) {
                const expected = i >= 2 && i < 9 ? source[source.length - 7 + i - 2] : 0x55;
                if (targetBytes[i] !== expected) throw new Error('partial read overwrite');
            }
            if (readSync(fd, target, 0, 0, 0) !== 0) throw new Error('zero read');
            if (readSync(fd, target, 0, 20, source.length) !== 0) throw new Error('EOF');
        }
        const result = Buffer.alloc(source.length);
        for (let offset = 0; offset < result.length; offset += 65536) {
            const count = Math.min(65536, result.length - offset);
            if (readSync(fd, result, offset, count, offset) !== count) throw new Error('chunk read');
        }
        if (!result.equals(source)) throw new Error('chunk data mismatch');
        const originalSet = Uint8Array.prototype.set;
        try {
            Uint8Array.prototype.set = () => { throw new Error('overridden set called'); };
            const target = Buffer.alloc(21);
            target.set = () => { throw new Error('overridden instance set called'); };
            if (readSync(fd, target, 0, 21, 17) !== 21 || !target.equals(source.subarray(17, 38))) throw new Error('overridden set read');
        } finally {
            Uint8Array.prototype.set = originalSet;
        }
        const hasInstanceDescriptor = Object.getOwnPropertyDescriptor(Uint8Array, Symbol.hasInstance);
        const first = Buffer.alloc(1);
        const second = Buffer.alloc(1);
        const positionFd = openSync(path, 'r');
        try {
            try {
                Object.defineProperty(Uint8Array, Symbol.hasInstance, {
                    configurable: true,
                    value: () => { throw new Error('overridden hasInstance called'); },
                });
                if (readSync(positionFd, first, 0, 1, null) !== 1) throw new Error('implicit first read');
            } finally {
                if (hasInstanceDescriptor) Object.defineProperty(Uint8Array, Symbol.hasInstance, hasInstanceDescriptor);
                else delete Uint8Array[Symbol.hasInstance];
            }
            if (readSync(positionFd, second, 0, 1, null) !== 1 || first[0] !== source[0] || second[0] !== source[1]) throw new Error('implicit file position');
        } finally {
            closeSync(positionFd);
        }
        return true;
    } finally {
        closeSync(fd);
    }
};

export const run = () => {
    console.log("Current working directory:", cwd());
    console.log("Arguments:", argv);
    console.log("Environment variables:");
    const sortedEnv = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));
    sortedEnv.forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
    });

    const sortedEnv2 = Object.entries(env2).sort(([a], [b]) => a.localeCompare(b));
    sortedEnv2.forEach(([key, value]) => {
        console.log(`@@ ${key}: ${value}`);
    })

    const content = readFileSync("input.txt", "utf8");
    writeFileSync("/test/output.txt", content + " - Processed by test");
};

export const runAsync = async () => {
    readFile("input.txt", "utf8", (error, content) => {
        if (error) {
            console.error("Error reading file:", error);
            return;
        }
        console.log(content);
        writeFile("/test/output.txt", content + " - Processed by test", (error) => {
            if (error) {
                console.error("Error writing file:", error);
            }
        });
    });
};

export const testReadFileSyncFastPath = () => {
    const binaryPath = "/test/read-file-sync-fast-path.bin";
    const emptyPath = "/test/read-file-sync-empty.bin";
    const missingPath = "/test/read-file-sync-missing.bin";
    const directoryPath = "/test/read-file-sync-directory";
    const bytes = Buffer.from([0x00, 0x41, 0xff, 0xc3, 0x28, 0xef, 0xbb, 0xbf]);
    writeFileSync(binaryPath, bytes);
    writeFileSync(emptyPath, Buffer.alloc(0));
    mkdirSync(directoryPath);

    const captureError = operation => {
        try {
            operation();
            return {threw: false};
        } catch (error) {
            return {
                threw: true,
                code: error.code,
                syscall: error.syscall,
                hasPath: "path" in error,
                path: error.path,
                message: error.message,
            };
        }
    };
    const fd = openSync(binaryPath, "r");
    let fdHex;
    try {
        fdHex = readFileSync(fd).toString("hex");
    } finally {
        closeSync(fd);
    }
    return JSON.stringify({
        expectedHex: bytes.toString("hex"),
        bufferHex: readFileSync(binaryPath).toString("hex"),
        utf8: readFileSync(binaryPath, "utf8"),
        expectedUtf8: bytes.toString("utf8"),
        latin1: readFileSync(binaryPath, "latin1"),
        expectedLatin1: bytes.toString("latin1"),
        emptyLength: readFileSync(emptyPath).length,
        urlHex: readFileSync(new URL(`file://${binaryPath}`)).toString("hex"),
        bufferPathHex: readFileSync(Buffer.from(binaryPath)).toString("hex"),
        customFlagHex: readFileSync(binaryPath, {flag: "r+"}).toString("hex"),
        fdHex,
        missing: captureError(() => readFileSync(missingPath)),
        directory: captureError(() => readFileSync(directoryPath)),
        tooLarge: captureError(() => readFileSync("/test/read-file-sync-too-large.bin")),
    });
};

export const testFsPromisesWriteFile = async () => {
    try {
        await fsPromises.writeFile("/test/promises-output.txt", "written via fs/promises");
        console.log("writeFile succeeded");
    } catch (e) {
        console.log("writeFile failed:", e.message);
    }
};

export const testFsPromisesRename = async () => {
    try {
        // First create a file to rename
        writeFileSync("/test/before-rename.txt", "content to rename");
        await fsPromises.rename("/test/before-rename.txt", "/test/after-rename.txt");
        console.log("rename succeeded");
    } catch (e) {
        console.log("rename failed:", e.message);
    }
};

export const testFsPromisesMkdir = async () => {
    try {
        await fsPromises.mkdir("/test/new-dir");
        console.log("mkdir succeeded");
    } catch (e) {
        console.log("mkdir failed:", e.message);
    }
};

export const testFsPromisesMkdirRecursive = async () => {
    try {
        await fsPromises.mkdir("/test/nested/deep/dir", { recursive: true });
        console.log("mkdir recursive succeeded");
    } catch (e) {
        console.log("mkdir recursive failed:", e.message);
    }
};

export const testFsPromisesUnlink = async () => {
    try {
        // First create a file to delete
        writeFileSync("/test/to-delete.txt", "file to be deleted");
        await fsPromises.unlink("/test/to-delete.txt");
        console.log("unlink succeeded");
    } catch (e) {
        console.log("unlink failed:", e.message);
    }
};

// Sync tests for rename
export const testRenameSync = () => {
    try {
        writeFileSync("/test/rename-sync-before.txt", "content for rename sync");
        renameSync("/test/rename-sync-before.txt", "/test/rename-sync-after.txt");
        console.log("renameSync succeeded");
    } catch (e) {
        console.log("renameSync failed:", e.message);
    }
};

// Callback test for rename
export const testRenameCallback = async () => {
    writeFileSync("/test/rename-cb-before.txt", "content for rename callback");
    rename("/test/rename-cb-before.txt", "/test/rename-cb-after.txt", (error) => {
        if (error) {
            console.log("rename callback failed:", error);
        } else {
            console.log("rename callback succeeded");
        }
    });
};

// Sync tests for mkdir
export const testMkdirSync = () => {
    try {
        mkdirSync("/test/mkdir-sync-dir");
        console.log("mkdirSync succeeded");
    } catch (e) {
        console.log("mkdirSync failed:", e.message);
    }
};

export const testMkdirSyncRecursive = () => {
    try {
        mkdirSync("/test/mkdir-sync-nested/deep/dir", { recursive: true });
        console.log("mkdirSync recursive succeeded");
    } catch (e) {
        console.log("mkdirSync recursive failed:", e.message);
    }
};

// Callback tests for mkdir
export const testMkdirCallback = async () => {
    mkdir("/test/mkdir-cb-dir", (error) => {
        if (error) {
            console.log("mkdir callback failed:", error);
        } else {
            console.log("mkdir callback succeeded");
        }
    });
};

export const testMkdirCallbackRecursive = async () => {
    mkdir("/test/mkdir-cb-nested/deep/dir", { recursive: true }, (error) => {
        if (error) {
            console.log("mkdir callback recursive failed:", error);
        } else {
            console.log("mkdir callback recursive succeeded");
        }
    });
};

// Sync test for unlink
export const testUnlinkSync = () => {
    try {
        writeFileSync("/test/unlink-sync-file.txt", "file to be deleted sync");
        unlinkSync("/test/unlink-sync-file.txt");
        console.log("unlinkSync succeeded");
    } catch (e) {
        console.log("unlinkSync failed:", e.message);
    }
};

// Callback test for unlink
export const testUnlinkCallback = async () => {
    writeFileSync("/test/unlink-cb-file.txt", "file to be deleted callback");
    unlink("/test/unlink-cb-file.txt", (error) => {
        if (error) {
            console.log("unlink callback failed:", error);
        } else {
            console.log("unlink callback succeeded");
        }
    });
};

export const testRecursiveRm = async () => {
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    for (const [label, remove] of [
        ["sync", async (path, options) => rmSync(path, options)],
        ["promises", fsPromises.rm],
    ]) {
        const root = `/test/rm-${label}`;
        const outside = `/test/outside-${label}`;
        mkdirSync(outside);
        writeFileSync(`${outside}/keep`, "outside data");
        mkdirSync(`${root}/a/b`, {recursive: true});
        writeFileSync(`${root}/a/b/leaf`, "nested");
        writeFileSync(`${root}/sibling`, "sibling");
        symlinkSync(`../../outside-${label}`, `${root}/a/link`);
        symlinkSync(`missing-target`, `${root}/dangling`);
        await remove(root, {recursive: true});
        check(!existsSync(root), "nested tree remains");
        check(readFileSync(`${outside}/keep`, "utf8") === "outside data", "descendant link followed");
        symlinkSync(`outside-${label}`, root);
        await remove(root, {recursive: true});
        check(!existsSync(root), "top-level link remains");
        check(readFileSync(`${outside}/keep`, "utf8") === "outside data", "top-level link followed");
        mkdirSync(`${outside}/tree/nested`, {recursive: true});
        writeFileSync(`${outside}/tree/nested/leaf`, "ancestor target");
        const alias = `/test/alias-${label}`;
        symlinkSync(`outside-${label}`, alias);
        await remove(`${alias}/tree`, {recursive: true});
        check(!existsSync(`${outside}/tree`), "ancestor symlink target tree remains");
        check(lstatSync(alias).isSymbolicLink(), "ancestor symlink removed");
        check(readFileSync(`${alias}/keep`, "utf8") === "outside data", "ancestor sibling removed");
        await remove(`${root}/missing/nested`, {recursive: true, force: true});
        try {
            await remove(`${root}/missing/nested`, {recursive: true});
            throw new Error("missing path accepted");
        } catch (error) {
            check(error.code === "ENOENT" && error.syscall === "lstat" && error.path === `${root}/missing/nested`, "missing error contract");
        }
        try {
            await remove(outside);
            throw new Error("nonempty directory accepted");
        } catch (error) {
            check(error.code === "ENOTEMPTY" && error.syscall === "rm" && error.path === outside, "nonempty error contract");
        }
    }
    try {
        rmSync("/", {recursive: true});
        throw new Error("root removal accepted");
    } catch (error) {
        check(error.code === "EBUSY" && error.syscall === "rm", "root error contract");
    }
    check(readFileSync("/test/outside-sync/keep", "utf8") === "outside data", "root removal mutated data");
};
