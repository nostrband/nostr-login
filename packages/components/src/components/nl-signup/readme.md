# nl-signup



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description | Type     | Default                      |
| ------------- | -------------- | ----------- | -------- | ---------------------------- |
| `bunkers`     | `bunkers`      |             | `string` | `'nsec.app,highlighter.com'` |
| `description` | `description`  |             | `string` | `'Join the Nostr network.'`  |
| `titleSignup` | `title-signup` |             | `string` | `'Sign up'`                  |


## Events

| Event           | Description | Type                  |
| --------------- | ----------- | --------------------- |
| `nlCheckSignup` |             | `CustomEvent<string>` |
| `nlSignup`      |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [nl-select](../nl-select)
- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-signup --> nl-select
  nl-signup --> button-base
  nl-auth --> nl-signup
  style nl-signup fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
