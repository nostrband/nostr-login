# nl-local-signup

<!-- Auto Generated Below -->


## Properties

| Property           | Attribute           | Description | Type      | Default                                                  |
| ------------------ | ------------------- | ----------- | --------- | -------------------------------------------------------- |
| `description`      | `description`       |             | `string`  | `'Choose any username, you can always change it later.'` |
| `descriptionNjump` | `description-njump` |             | `string`  | `'Proceed to creating your Nostr profile in a new tab.'` |
| `signupNjump`      | `signup-njump`      |             | `boolean` | `false`                                                  |
| `titleSignup`      | `title-signup`      |             | `string`  | `'Create Nostr profile'`                                 |


## Events

| Event           | Description | Type                   |
| --------------- | ----------- | ---------------------- |
| `fetchHandler`  |             | `CustomEvent<boolean>` |
| `nlLocalSignup` |             | `CustomEvent<string>`  |
| `nlSignupNjump` |             | `CustomEvent<void>`    |


## Dependencies

### Used by

 - [nl-auth](../nl-auth)

### Depends on

- [button-base](../button-base)

### Graph
```mermaid
graph TD;
  nl-local-signup --> button-base
  nl-auth --> nl-local-signup
  style nl-local-signup fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
