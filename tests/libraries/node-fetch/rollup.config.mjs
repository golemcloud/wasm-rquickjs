import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import fs from "fs";

// Discover all test-*.js files automatically
const testFiles = fs.readdirSync(".").filter(f => f.startsWith("test-") && f.endsWith(".js"));

// Node.js built-in modules — kept as external imports (the runtime provides them)
const nodeBuiltins = [
  "assert", "buffer", "child_process", "crypto", "dgram", "dns", "events",
  "fs", "http", "http2", "https", "module", "net", "os", "path",
  "perf_hooks", "querystring", "readline", "stream", "string_decoder",
  "tls", "url", "util", "v8", "vm", "worker_threads", "zlib",
];

const externalPackages = (id) => {
  // Keep Node.js built-ins as external imports
  const bare = id.replace(/^node:/, "");
  return nodeBuiltins.includes(bare);
};

export default testFiles.map((input) => ({
  input,
  output: {
    file: `dist/${input.replace(".js", ".bundle.js")}`,
    format: "esm",
    inlineDynamicImports: true,
    sourcemap: false,
  },
  external: externalPackages,
  plugins: [
    nodeResolve({
      extensions: [".mjs", ".js", ".json", ".node"],
    }),
    commonjs({
      include: ["node_modules/**"],
    }),
    json(),
  ],
}));
