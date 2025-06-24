# Additional Configurations

By reading a list of given paths in environment variable `X_CFG_FLS`, our server then parses these JSON files and loads them into its global variable `process.env` for further usages:

```ts
// Loads environment variables from listed configuration files.
(() => {
  const name = 'X_CFG_FLS';
  const files = process.env[name] as string;
  if (files) {
    console.debug(`${name}="${files}"`);
    files.split(',').forEach(loadEnvFromJson);
  }
})();
```

This mechanism is to support synchronizing secrets/credentials from GCP Secret Manager into the deployed application.
