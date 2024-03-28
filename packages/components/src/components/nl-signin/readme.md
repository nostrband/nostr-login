# nl-signin



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type     | Default                          |
| ------------- | ------------- | ----------- | -------- | -------------------------------- |
| `description` | `description` |             | `string` | `'Please enter your user name.'` |
| `titleLogin`  | `title-login` |             | `string` | `'Log in'`                       |


## Events

| Event          | Description | Type                   |
| -------------- | ----------- | ---------------------- |
| `fetchHandler` |             | `CustomEvent<boolean>` |
| `nlCheckLogin` |             | `CustomEvent<string>`  |
| `nlLogin`      |             | `CustomEvent<string>`  |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [nl-loading](../nl-loading)
- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-signin --> nl-loading
  nl-signin --> button-base
  nl-loading --> button-base
  nl-auth --> nl-signin
  style nl-signin fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
