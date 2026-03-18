import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import fs from "fs";

const testFiles = fs.readdirSync(".").filter(f => f.startsWith("test-") && f.endsWith(".js"));

const nodeBuiltins = [
  "assert", "buffer", "child_process", "crypto", "dgram", "dns", "events",
  "fs", "http", "http2", "https", "module", "net", "os", "path",
  "perf_hooks", "querystring", "readline", "stream", "string_decoder",
  "tls", "url", "util", "v8", "vm", "worker_threads", "zlib",
];

const externalPackages = (id) => {
  const bare = id.replace(/^node:/, "");
  return nodeBuiltins.includes(bare);
};

const aliasGoogleGaxFallback = {
  name: 'alias-google-gax-fallback',
  resolveId(source, importer, options) {
    if (source === 'google-gax') {
      return this.resolve('google-gax/fallback', importer, { ...options, skipSelf: true });
    }
    return null;
  },
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
    aliasGoogleGaxFallback,
    nodeResolve({
      browser: true,
      extensions: [".mjs", ".js", ".json", ".node"],
    }),
    commonjs({
      include: ["node_modules/**"],
    }),
    json(),
  ],
}));
