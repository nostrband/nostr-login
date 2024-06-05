# nl-welcome

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type           | Default                                                                                           |
| -------------- | --------------- | ----------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `authMethods`  | --              |             | `AuthMethod[]` | `[]`                                                                                              |
| `description`  | `description`   |             | `string`       | `'This website is part of the Nostr network. Log in with your Nostr account or sign up to join.'` |
| `hasExtension` | `has-extension` |             | `boolean`      | `false`                                                                                           |
| `titleWelcome` | `title-welcome` |             | `string`       | `'Join Nostr!'`                                                                                   |


## Events

| Event              | Description | Type                |
| ------------------ | ----------- | ------------------- |
| `nlLoginExtension` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-welcome --> button-base
  nl-auth --> nl-welcome
  style nl-welcome fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
