# nl-confirm-logout

<!-- Auto Generated Below -->


## Events

| Event                | Description | Type                   |
| -------------------- | ----------- | ---------------------- |
| `handleBackUpModal`  |             | `CustomEvent<string>`  |
| `handleLogoutBanner` |             | `CustomEvent<string>`  |
| `nlCloseModal`       |             | `CustomEvent<any>`     |
| `stopFetchHandler`   |             | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-confirm-logout --> button-base
  nl-auth --> nl-confirm-logout
  style nl-confirm-logout fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
