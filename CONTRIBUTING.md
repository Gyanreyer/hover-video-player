# Contributing to hover-video-player

## Testing

Tests can be found in the `/tests` directory. They are all integration tests using Playwright.
Tests are all run against html files which are served with `web-dev-server`. Ideally, each test spec file should have its own corresponding html file.

Tests can be run with `npm run test`.

To run tests on a specific file instead of the whole suite, use `npm run test -- path/to/file.spec.ts`.

## Development

The core component code is found in the `/src` directory.

For live local testing, you can use the `demo/index.html` file which can be served with `npm run serve`.

## Publishing

1. Update version in `package.json`
1. `npm run build:release`
1. `npm publish`
