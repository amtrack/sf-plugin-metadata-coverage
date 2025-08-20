# sf-plugin-metadata-coverage

> sf plugin to check the metadata coverage of metadata types in your sfdx project using the metadata coverage report

[Metadata Coverage Report](https://developer.salesforce.com/docs/success/metadata-coverage-report/references/coverage-report/metadata-coverage-report.html)

## Installation

```shell
sf plugins install sf-plugin-metadata-coverage
```

## Usage

A common scenario might be to check your sfdx project before trying to create an Unlocked Package.

```shell
sf metadata-coverage check --2gp-unlocked
```

Will all of my metadata types finally be supported for Unlocked Packaging in the upcoming release?

```shell
sf metadata-coverage check --2gp-unlocked --api-version 65.0
```

Available flags:

```shell
# only check if there are metadata types that are unknown to the Metadata Coverage Report
sf metadata-coverage check
# check if the metadata types are supported in
sf metadata-coverage check --1gp-managed
sf metadata-coverage check --1gp-unmanaged
sf metadata-coverage check --2gp-managed
sf metadata-coverage check --2gp-unlocked
sf metadata-coverage check --2gp-unlocked-with-namespace
sf metadata-coverage check --source-tracking
sf metadata-coverage check --tooling-api
sf metadata-coverage check --metadata-api
sf metadata-coverage check --apex-metadata-api
sf metadata-coverage check --changeset
# or any combination
sf metadata-coverage check --1gp-managed --2gp-managed
```

The command prints metadata types that are not supported and exits with an error code.

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
