import esbuild from "esbuild";
import { minifyTemplates, writeFiles } from "esbuild-minify-templates";

const shouldWatch = process.argv.includes("--watch");

await esbuild.build({
  entryPoints: ["src/hover-video-player.ts"],
  outfile: "dist/index.js",
  plugins: [minifyTemplates(), writeFiles()],
  write: false, // this needs to be left to the writeFiles plugin
  minify: true,
  // Mangle all internal private properties, which start with an underscore
  mangleProps: /^_.+$/,
  sourcemap: true,
  watch: shouldWatch,
  logLevel: "info",
});
