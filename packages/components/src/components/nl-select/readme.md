# nl-select

<!-- Auto Generated Below -->


## Properties

| Property   | Attribute   | Description | Type                                             | Default     |
| ---------- | ----------- | ----------- | ------------------------------------------------ | ----------- |
| `darkMode` | `dark-mode` |             | `boolean`                                        | `false`     |
| `options`  | --          |             | `OptionType[]`                                   | `undefined` |
| `selected` | `selected`  |             | `number`                                         | `undefined` |
| `theme`    | `theme`     |             | `"default" \| "lemonade" \| "ocean" \| "purple"` | `'default'` |


## Events

| Event          | Description | Type                  |
| -------------- | ----------- | --------------------- |
| `selectDomain` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [nl-import-flow](../nl-import-flow)
 - [nl-otp-migrate](../nl-otp-migrate)
 - [nl-signup](../nl-signup)

### Graph
```mermaid
graph TD;
  nl-import-flow --> nl-select
  nl-otp-migrate --> nl-select
  nl-signup --> nl-select
  style nl-select fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
