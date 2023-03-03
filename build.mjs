import esbuild from "esbuild";
import fs from "fs";

const outputDir = "dist";

const shouldClean = process.argv.includes("--clean");

if (shouldClean) {
  // Clean up any files in the output directory, or make sure the output directory exists
  if (fs.existsSync(outputDir)) {
    await Promise.all(
      fs
        .readdirSync(outputDir)
        .map((file) => fs.promises.unlink(`${outputDir}/${file}`))
    );
  } else {
    fs.mkdirSync(outputDir);
  }
}

let buildTargets;
const buildsArgIndex = process.argv.indexOf("--builds");
if (buildsArgIndex < 0) {
  buildTargets = ["all"];
} else {
  buildTargets = process.argv[buildsArgIndex + 1].split(",");
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

const builds = [];

buildTargets.forEach((buildTarget) => {
  if (buildTarget === "esm" || buildTarget === "all") {
    builds.push(
      esbuild.build({
        ...sharedOptions,
        outfile: `${outputDir}/index.mjs`,
        format: "esm",
      })
    );
  }

  if (buildTarget === "cjs" || buildTarget === "all") {
    builds.push(
      esbuild.build({
        ...sharedOptions,
        outfile: `${outputDir}/index.cjs`,
        format: "cjs",
      })
    );
  }

  if (buildTarget === "iife" || buildTarget === "all") {
    builds.push(
      esbuild.build({
        ...sharedOptions,
        outfile: `${outputDir}/index.client.js`,
        format: "iife",
      })
    );
  }
});

if (builds.length === 0) {
  console.error("No valid builds specified for the --builds arg.");
  process.exit(1);
}

await Promise.all(builds);

// Create a .webc file which just imports the built client-side script
await fs.writeFileSync(
  `${outputDir}/hover-video-player.webc`,
  `<script src="./index.client.js"></script>`
);
