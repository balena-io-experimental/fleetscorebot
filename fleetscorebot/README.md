# Fleet Score Calculation helper

This script does a count of balenaOS version / supervisor version combos for all the devices visible for the user running it (defined by the API key required).

Usage:

- Create a `config/<ENVIRONMENT>.json` file where `ENVIRONMENT` is a name you choose, and points to an API endpoint ("apiEndpoint") and contains an API key ("authToken") for that endpoint
- Run script with `NODE_ENV=<ENVIRONMENT> node index.js get` to get a list of balenaOS version / supervisor version / count list
- This script comes set up with shortcuts for the case when `<ENVIRONMENT>` is either `staging` or `production`, and can run the script with `npm start staging` or `npm start prod`, respectively.

The output is a tab-delimited table such as:

```
2.9.6   6.6.0   12
2.7.8   6.5.9   4
...
```

which can be imported e.g. into Google Sheets by copy-paste for further processing

## License

Copyright 2018 Gergely Imreh <imrehg@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
