import {readFile, readFileSync, writeFile, writeFileSync} from "node:fs";
import {cwd, argv, env} from "node:process";

export const run = () => {
    console.log("Current working directory:", cwd());
    console.log("Arguments:", argv);
    console.log("Environment variables:");
    const sortedEnv = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));
    sortedEnv.forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
    });

    const content = readFileSync("input.txt", "utf8");
    writeFileSync("/test/output.txt", content + " - Processed by test");
};

export const runAsync = async () => {
    readFile("input.txt", "utf8", (content, error) => {
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