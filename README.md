# sf-plugin-metadata-coverage

## Development

After cloning this repository, install the dependencies:

```sh-session
npm ci
```

Use `bin/dev.js` to run the plugin while development

```sh-session
./bin/dev.js org hello -h
```

or link it with sfdx

```sh-session
sf plugins link
sf which org hello
sf org hello -h
```

## Testing

```sh-session
npm run test
```
