# @notjustcoders/ioc-arise

## 1.0.2

### Patch Changes

- Bug: classes that do not depend on any interface were ignored by the Analyzer (e use-cases )

## 1.0.1

### Patch Changes

- 9cfa361: Version 1.0 Release includes:
  - Fully type safe ioc container auto generation based on code static analysis without polluting your classes with decorators or any library imports.
  - Support for classes and interfaces with cycles detection.
  - Support for injection scopes (transient and singleton) via jsDoc comments.
  - Support for cli default args configuration file `ioc.config.json`.
  - Support module resolution with cycles detection (module are defined in `ioc.config.json`).
- Analysis results visualization command, the renderer is decoupled via an interface and implemented by a console renderer (which makes supporting new renderers a breeze)

## 1.0.0

### Patch Changes

- Version 1.0 Release includes:
  - Fully type safe ioc container auto generation based on code static analysis without polluting your classes with decorators or any library imports.
  - Support for classes and interfaces with cycles detection.
  - Support for injection scopes (transient and singleton) via jsDoc comments.
  - Support for cli default args configuration file `ioc.config.json`.
  - Support module resolution with cycles detection (module are defined in `ioc.config.json`).
