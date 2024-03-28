# nl-signin-bunker-url



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type     | Default                           |
| ------------- | ------------- | ----------- | -------- | --------------------------------- |
| `description` | `description` |             | `string` | `'Please enter your bunker url.'` |
| `titleLogin`  | `title-login` |             | `string` | `'Log in with bunker url'`        |


## Events

| Event          | Description | Type                  |
| -------------- | ----------- | --------------------- |
| `nlCheckLogin` |             | `CustomEvent<string>` |
| `nlLogin`      |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-signin-bunker-url --> button-base
  nl-auth --> nl-signin-bunker-url
  style nl-signin-bunker-url fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
