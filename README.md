# MYCURE Dynamic Modules (mycure-dynamic-modules)

# TODOs

- [ ] Firebase hosting setup for multiple apps
- [ ] Github action for each dynamic app
- [ ] Build commands (Right now local quasar uses old cli version)
- [ ] Documentation for app creation

## Layouts

**Main Layout**

- Main Toolbar
  - Route Title
  - Logged In User
  - Notifications
  - Messages
- Main Nav
  - All routes (3-level deep)
- Main Footer

**Blank Layout**

- Container
  - Slot

## Components

**Commons** - All reusable components. Everything that can be reused across any type of page, e.g. loaders, alerts, etc.
**Module specific components** - E.g. Queue board specific components.

## Pages

All individual pages. A page should be locked in a specific module folder, unless it's a reusable page, e.g. login page.

## Store

*No specific use-case yet*

## Router

**Routes**

Should be based on config. There's a default, but it can be overriden by user config.

**Guards**

*Write a guide in injecting route guards for specific module needs*

## Theme

Theme should have the capability to dynamically change up to module level. Meaning, module A can have a different them than module B in a single build.

## Components

**SFC structure**

```vue
<template>
</template>

<script>
export default {
  setup () {
    // This must be the arrangement of elements
    // inside the setup method

    // 1. Helper custom scripts
    // 2. Store declarations
    // 3. Refs
    // 4. Computed properties
    // 5. init method
    // 6. functions
    // 7. Even functions - must start with `on` e.g. onClick, onHover, onSearch, etc
    // 8. Watchers
    // 9. Lifecycle hooks
    // 10. return
  }
}
</script>
```
