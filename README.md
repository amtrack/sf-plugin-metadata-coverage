# sf-plugin-metadata-coverage

> sf plugin to check the metadata coverage report for the given source

[Metadata Coverage Report](https://developer.salesforce.com/docs/success/metadata-coverage-report/references/coverage-report/metadata-coverage-report.html)

## Installation

```shell
sf plugins install sf-plugin-metadata-coverage
```

## Usage

```sh-session
$ sf metadata-coverage check --source-dir force-app --2gp-unlocked
Downloading Metadata Coverage Report v64... done
Found 38 metadata type to check.
All metadata types are supported.
```

The command prints metadata types that are not supported and exits with an error code.

```sh-session
$ sf metadata-coverage check --source-dir force-app --2gp-managed
Using cached Metadata Coverage Report v64.
Found 38 metadata type to check.
=== Unsupported Metadata Types

┌───────────────────────┬───────────────────┬───────────────────────┐
│ Type                  │ Managed Packaging │ Members               │
├───────────────────────┼───────────────────┼───────────────────────┤
│ CustomHelpMenuSection │ false             │ CustomHelpMenuSection │
└───────────────────────┴───────────────────┴───────────────────────┘

Error (2): Some metadata types are not supported.
```

<!-- commands -->
* [`sf metadata-coverage check`](#sf-metadata-coverage-check)
* [`sf metadata-coverage download`](#sf-metadata-coverage-download)

## `sf metadata-coverage check`

Check the Metadata Coverage for the given source directory, metadata type or package.xml.

```
USAGE
  $ sf metadata-coverage check [--json] [--flags-dir <value>] [--api-version <value>] [-d <value>...] [-x <value>] [-m
    <value>...] [--1gp-managed] [--1gp-unmanaged] [--2gp-managed] [--2gp-unlocked] [--2gp-unlocked-with-namespace]
    [--source-tracking] [--tooling-api] [--metadata-api] [--apex-metadata-api] [--changesets]

FLAGS
  --api-version=<value>  The API version of the Metadata Coverage Report to use.

SOURCES FLAGS
  -d, --source-dir=<value>...  File paths for source to check.
  -m, --metadata=<value>...    Metadata component names to check.
  -x, --manifest=<value>       File path for the manifest (package.xml) that specifies the components to check.

METADATA COVERAGE CHANNELS FLAGS
  --1gp-managed
  --1gp-unmanaged
  --2gp-managed
  --2gp-unlocked
  --2gp-unlocked-with-namespace
  --apex-metadata-api
  --changesets
  --metadata-api
  --source-tracking
  --tooling-api

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  $ sf metadata-coverage check --source-dir force-app --2gp-unlocked

  $ sf metadata-coverage check --manifest src/package.xml --1gp-managed

  $ sf metadata-coverage check --metadata CustomHelpMenuSection --2gp-unlocked

  $ sf metadata-coverage check --metadata CustomHelpMenuSection --2gp-unlocked --2gp-managed

  $ sf metadata-coverage check --metadata CustomHelpMenuSection --2gp-managed --api-version 65.0
```

_See code: [lib/commands/metadata-coverage/check.js](https://github.com/amtrack/sf-plugin-metadata-coverage/blob/main/src/commands/metadata-coverage/check.ts)_

## `sf metadata-coverage download`

Explicitly download a Metadata Coverage Report.

```
USAGE
  $ sf metadata-coverage download [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  --api-version=<value>  The API version of the Metadata Coverage Report to use.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Explicitly download a Metadata Coverage Report.

  By default it downloads the Metadata Coverage Report for the version of the sfdx-project.json > sourceApiVersion.

EXAMPLES
  $ sf metadata-coverage download

  $ sf metadata-coverage download --api-version 65.0
```

_See code: [lib/commands/metadata-coverage/download.js](https://github.com/amtrack/sf-plugin-metadata-coverage/blob/main/src/commands/metadata-coverage/download.ts)_
<!-- commandsstop -->

### Example Use Cases

Is the Metadata Type "CustomHelpMenuSection" supported for a 2GP Managed Package?

```shell
sf metadata-coverage check -m CustomHelpMenuSection --2gp-managed
```

... or maybe in the upcoming release?

```shell
sf metadata-coverage check -m CustomHelpMenuSection --2gp-managed --api-version 65.0
```

Can I create an Unlocked Package from my source directory?

```shell
sf metadata-coverage check --source-dir force-app --2gp-unlocked
```

Can I convert my 1GP Managed Package to a 2GP Managed Package?

```shell
sf project retrieve start --package-name MyPkg --target-metadata-dir src --unzip --target-org my-pkg-org
sf metadata-coverage check --manifest src/unpackaged/package.xml --2gp-managed
```

## Development

After cloning this repository, install the dependencies:

```shell
npm ci
```

Use `bin/dev.js` to run the plugin while development

```shell
./bin/dev.js metadata-coverage check -h
```

or link it with sfdx

```shell
sf plugins link
sf which metadata-coverage check
sf metadata-coverage check -h
```

## Testing

```shell
npm run test
```
