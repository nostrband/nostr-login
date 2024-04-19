# nl-change-account

<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type                                             | Default     |
| ---------------- | ----------------- | ----------- | ------------------------------------------------ | ----------- |
| `accounts`       | --                |             | `Info[]`                                         | `[]`        |
| `currentAccount` | `current-account` |             | `string`                                         | `''`        |
| `darkMode`       | `dark-mode`       |             | `boolean`                                        | `false`     |
| `theme`          | `theme`           |             | `"default" \| "lemonade" \| "ocean" \| "purple"` | `'default'` |


## Events

| Event                    | Description | Type                  |
| ------------------------ | ----------- | --------------------- |
| `handleOpenWelcomeModal` |             | `CustomEvent<string>` |
| `handleSwitchAccount`    |             | `CustomEvent<Info>`   |


## Dependencies

### Used by

 - [nl-banner](../nl-banner)

### Graph
```mermaid
graph TD;
  nl-banner --> nl-change-account
  style nl-change-account fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
