# MYCURE Dynamic Modules (mycure-dynamic-modules)

# TODOs

- [ ] Firebase hosting setup for multiple modules
- [ ] Github action for each dynamic module
- [ ] Build commands (Right now local quasar uses old cli version)

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