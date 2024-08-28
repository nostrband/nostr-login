# nl-previously-logged



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type           | Default                                                                   |
| ------------- | ------------- | ----------- | -------------- | ------------------------------------------------------------------------- |
| `accounts`    | --            |             | `Info[]`       | `[]`                                                                      |
| `description` | `description` |             | `string`       | `'Switch between active accounts or choose a recent one for fast login.'` |
| `recents`     | --            |             | `RecentType[]` | `[]`                                                                      |
| `titlePage`   | `title-page`  |             | `string`       | `'Your accounts'`                                                         |


## Events

| Event                  | Description | Type                                                                                                                            |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `nlLoginRecentAccount` |             | `CustomEvent<{ name?: string; picture?: string; nip05?: string; pubkey: string; bunkerUrl?: string; authMethod: AuthMethod; }>` |
| `nlRemoveRecent`       |             | `CustomEvent<{ name?: string; picture?: string; nip05?: string; pubkey: string; bunkerUrl?: string; authMethod: AuthMethod; }>` |
| `nlSwitchAccount`      |             | `CustomEvent<Info>`                                                                                                             |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [nl-login-status](../nl-login-status)

### Graph
```mermaid
graph TD;
  nl-previously-logged --> nl-login-status
  nl-auth --> nl-previously-logged
  style nl-previously-logged fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
