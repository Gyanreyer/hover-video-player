import esbuild from "esbuild";
import { minifyTemplates, writeFiles } from "esbuild-minify-templates";

const isProduction = process.env.NODE_ENV === "prod";
const shouldWatch = process.argv.includes("--watch");

await esbuild.build({
  entryPoints: ["src/hover-video-player.ts"],
  outfile: "dist/index.js",
  plugins: [minifyTemplates(), writeFiles()],
  write: false, // this needs to be left to the writeFiles plugin
  minify: isProduction,
  sourcemap: !isProduction,
  watch: shouldWatch,
  logLevel: "info",
});
