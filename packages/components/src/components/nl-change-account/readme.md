# nl-change-account



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute   | Description | Type                                             | Default     |
| ---------------- | ----------- | ----------- | ------------------------------------------------ | ----------- |
| `accounts`       | --          |             | `Info[]`                                         | `[]`        |
| `currentAccount` | --          |             | `Info`                                           | `null`      |
| `darkMode`       | `dark-mode` |             | `boolean`                                        | `false`     |
| `theme`          | `theme`     |             | `"default" \| "lemonade" \| "ocean" \| "purple"` | `'default'` |


## Events

| Event                    | Description | Type                  |
| ------------------------ | ----------- | --------------------- |
| `handleOpenWelcomeModal` |             | `CustomEvent<string>` |
| `handleSwitchAccount`    |             | `CustomEvent<Info>`   |


## Dependencies

### Used by

 - [nl-banner](../nl-banner)

### Depends on

- [nl-login-status](../nl-login-status)

### Graph
```mermaid
graph TD;
  nl-change-account --> nl-login-status
  nl-banner --> nl-change-account
  style nl-change-account fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
