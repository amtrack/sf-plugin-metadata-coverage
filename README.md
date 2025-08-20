# sf-plugin-metadata-coverage

> sf plugin to check the metadata coverage of metadata types in your sfdx project using the metadata coverage report

[Metadata Coverage Report](https://developer.salesforce.com/docs/success/metadata-coverage-report/references/coverage-report/metadata-coverage-report.html)

## Installation

```shell
sf plugins install sf-plugin-metadata-coverage
```

## Usage

```sh-session
$ sf metadata-coverage check --source-dir force-app --2gp-unlocked
Found 38 metadata types to check.
Successfully checked Metadata Coverage Report.
```

The command prints metadata types that are not supported and exits with an error code.

### Input Sources

- `--source-dir`
- `--metadata`
- `--manifest`

### Checks

- `--1gp-managed`
- `--1gp-unmanaged`
- `--2gp-managed`
- `--2gp-unlocked`
- `--2gp-unlocked-with-namespace`
- `--source-tracking`
- `--tooling-api`
- `--metadata-api`
- `--apex-metadata-api`
- `--changeset`

### Example Use Cases

Is the Metadata Type "CustomHelpMenuSection" supportd for a 2GP Managed Package?

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
