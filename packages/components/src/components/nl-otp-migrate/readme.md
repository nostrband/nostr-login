# nl-otp-migrate



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description | Type                 | Default                                                                                                    |
| ------------- | -------------- | ----------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `services`    | --             |             | `ConnectionString[]` | `[]`                                                                                                       |
| `textImport`  | `text-import`  |             | `string`             | `'You will be prompted to import keys to the chosen service, and this website will connect to your keys.'` |
| `titleImport` | `title-import` |             | `string`             | `'Choose a service'`                                                                                       |
| `titleInfo`   | `title-info`   |             | `string`             | `'Import keys to storage service'`                                                                         |


## Events

| Event             | Description | Type                            |
| ----------------- | ----------- | ------------------------------- |
| `nlImportAccount` |             | `CustomEvent<ConnectionString>` |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [nl-select](../nl-select)
- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-otp-migrate --> nl-select
  nl-otp-migrate --> button-base
  nl-auth --> nl-otp-migrate
  style nl-otp-migrate fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
