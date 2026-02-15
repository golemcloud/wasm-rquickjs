import {readFile, readFileSync, writeFile, writeFileSync, rename, renameSync, mkdir, mkdirSync, unlink, unlinkSync} from "node:fs";
import {cwd, argv, env} from "node:process";
import {env as env2} from "process"; // validating that node:process is also registered as 'process'
import * as fsPromises from "node:fs/promises";

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