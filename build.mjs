import esbuild from "esbuild";
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

const MinifyCSSPlugin = {
  name: "css",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
      const file = await fs.promises.readFile(path);
      const css = await esbuild.transform(file, {
        loader: "css",
        minify: true,
      });
      return { loader: "text", contents: css.code };
    });
  },
};

const MinifyHTMLPlugin = {
  name: "html",
  setup(build) {
    build.onLoad({ filter: /\.html$/ }, async ({ path }) => {
      const file = await fs.promises.readFile(path, "utf-8");
      // Remove unnecessary whitespace (spaces, tabs, newlines) from the HTML
      const minifiedHTML = file
        // Replace all instances of 2+ spaces in a row with a single space
        .replace(/[ ]{2,}/g, " ")
        // Remove all tabs, newlines, and carriage returns
        .replace(/[\t\r\n\f]/g, "");
      return { loader: "text", contents: minifiedHTML };
    });
  },
};

const sharedOptions = {
  entryPoints: ["src/hover-video-player.ts"],
  plugins: [MinifyCSSPlugin, MinifyHTMLPlugin],
  minify: true,
  bundle: true,
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
    outfile: `${outputDir}/index.client.js`,
    format: "iife",
  }),
]);
