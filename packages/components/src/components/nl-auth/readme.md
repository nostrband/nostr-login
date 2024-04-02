# nl-auth



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                   | Description | Type                                             | Default                  |
| ----------------------- | --------------------------- | ----------- | ------------------------------------------------ | ------------------------ |
| `isSignInWithExtension` | `is-sign-in-with-extension` |             | `boolean`                                        | `true`                   |
| `startScreen`           | `start-screen`              |             | `string`                                         | `CURRENT_MODULE.WELCOME` |
| `theme`                 | `theme`                     |             | `"default" \| "lemonade" \| "ocean" \| "purple"` | `'default'`              |


## Events

| Event                     | Description | Type                  |
| ------------------------- | ----------- | --------------------- |
| `handleChangeDarkMode`    |             | `CustomEvent<string>` |
| `handleRemoveWindowNostr` |             | `CustomEvent<string>` |
| `nlCloseModal`            |             | `CustomEvent<any>`    |


## Dependencies

### Depends on

- [nl-welcome](../nl-welcome)
- [nl-signin](../nl-signin)
- [nl-signup](../nl-signup)
- [nl-info](../nl-info)
- [nl-info-extension](../nl-info-extension)
- [nl-signin-read-only](../nl-signin-read-only)
- [nl-signin-bunker-url](../nl-signin-bunker-url)

### Graph
```mermaid
graph TD;
  nl-auth --> nl-welcome
  nl-auth --> nl-signin
  nl-auth --> nl-signup
  nl-auth --> nl-info
  nl-auth --> nl-info-extension
  nl-auth --> nl-signin-read-only
  nl-auth --> nl-signin-bunker-url
  nl-welcome --> button-base
  nl-signin --> nl-loading
  nl-signin --> button-base
  nl-loading --> button-base
  nl-signup --> nl-loading
  nl-signup --> nl-select
  nl-signup --> button-base
  nl-signin-read-only --> button-base
  nl-signin-bunker-url --> button-base
  style nl-auth fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
