# nl-banner

<!-- Auto Generated Below -->

## Properties

| Property       | Attribute      | Description | Type                                                              | Default     |
| -------------- | -------------- | ----------- | ----------------------------------------------------------------- | ----------- |
| `isLoading`    | `is-loading`   |             | `boolean`                                                         | `false`     |
| `listNotifies` | --             |             | `string[]`                                                        | `[]`        |
| `nlTheme`      | `nl-theme`     |             | `"default" \| "lemonade" \| "ocean" \| "purple"`                  | `'default'` |
| `notify`       | --             |             | `{ confirm: number; url?: string; timeOut?: { link: string; }; }` | `null`      |
| `titleBanner`  | `title-banner` |             | `string`                                                          | `''`        |
| `userInfo`     | --             |             | `Info`                                                            | `null`      |

## Events

| Event                       | Description | Type                  |
| --------------------------- | ----------- | --------------------- |
| `handleLoginBanner`         |             | `CustomEvent<string>` |
| `handleLogoutBanner`        |             | `CustomEvent<string>` |
| `handleNotifyConfirmBanner` |             | `CustomEvent<string>` |
| `handleRetryConfirmBanner`  |             | `CustomEvent<string>` |
| `handleSetConfirmBanner`    |             | `CustomEvent<string>` |

---

_Built with [StencilJS](https://stenciljs.com/)_
