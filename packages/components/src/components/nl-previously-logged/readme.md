# nl-previously-logged

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type     | Default                                                                  |
| ------------- | ------------- | ----------- | -------- | ------------------------------------------------------------------------ |
| `description` | `description` |             | `string` | `'Switch between active accounts or choose recent ones for fast login.'` |
| `titlePage`   | `title-page`  |             | `string` | `'Your accounts'`                                                        |


## Events

| Event                  | Description | Type                                                                                                                                                                      |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nlLoginRecentAccount` |             | `CustomEvent<{ name?: string; picture?: string; readonly?: boolean; extension?: boolean; nip05?: string; pubkey: string; bunkerUrl?: string; typeAuthMethod?: string; }>` |
| `nlSwitchAccount`      |             | `CustomEvent<Info>`                                                                                                                                                       |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Graph
```mermaid
graph TD;
  nl-auth --> nl-previously-logged
  style nl-previously-logged fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
