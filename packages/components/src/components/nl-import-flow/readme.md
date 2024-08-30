# nl-import-flow

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description | Type     | Default                                                                                                                                                                                                                            |
| ------------- | -------------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bunkers`     | `bunkers`      |             | `string` | `'nsec.app'`                                                                                                                                                                                                                       |
| `textImport`  | `text-import`  |             | `string` | `'Your Nostr keys will be imported into this provider, and you will manage your keys on their website.'`                                                                                                                           |
| `textInfo`    | `text-info`    |             | `string` | `'Nostr accounts are controlled by cryptographic keys. Your keys are currently only stored in this browser tab. You should import them into a proper key storage service to avoid losing them, and to use with other Nostr apps.'` |
| `titleImport` | `title-import` |             | `string` | `'Choose a service'`                                                                                                                                                                                                               |
| `titleInfo`   | `title-info`   |             | `string` | `'Backup your account (Coming soon!)'`                                                                                                                                                                                             |


## Events

| Event             | Description | Type                  |
| ----------------- | ----------- | --------------------- |
| `nlImportAccount` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [button-base](../button-base)
- [nl-select](../nl-select)

### Graph
```mermaid
graph TD;
  nl-import-flow --> button-base
  nl-import-flow --> nl-select
  nl-auth --> nl-import-flow
  style nl-import-flow fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
