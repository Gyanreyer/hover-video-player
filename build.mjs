import esbuild from "esbuild";
import { minifyTemplates, writeFiles } from "esbuild-minify-templates";
import fs from "fs";

const outputDir = "dist";

// Clean up any files in the output directory, or make sure the output directory exists
if (fs.existsSync(outputDir)) {
  fs.readdirSync(outputDir).forEach((file) => {
    fs.unlinkSync(`${outputDir}/${file}`);
  });
} else {
  fs.mkdirSync(outputDir);
}

const shouldWatch = process.argv.includes("--watch");

const sharedOptions = {
  entryPoints: ["src/hover-video-player.ts"],
  plugins: [minifyTemplates(), writeFiles()],
  write: false, // this needs to be left to the writeFiles plugin
  minify: true,
  sourcemap: true,
  // Mangle all internal private properties, which start with an underscore
  mangleProps: /^_.+$/,
  watch: shouldWatch,
  logLevel: "info",
};

await Promise.all([
  // esm build
  esbuild.build({
    ...sharedOptions,
    outfile: `${outputDir}/index.mjs`,
    format: "esm",
  }),
  // cjs build
  esbuild.build({
    ...sharedOptions,
    outfile: `${outputDir}/index.cjs`,
    format: "cjs",
  }),
  // iife build for browsers
  esbuild.build({
    ...sharedOptions,
    outfile: `${outputDir}/index.js`,
    format: "iife",
  }),
]);
