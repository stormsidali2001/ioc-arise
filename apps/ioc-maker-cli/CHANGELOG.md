# @notjustcoders/ioc-arise

## 1.1.6

### Patch Changes

- fix(ioc): abstract class dependency injection bugs

## 1.1.5

### Patch Changes

- refactor(ioc-maker): improve abstract class handling and type system

## 1.1.4

### Patch Changes

- Fix: Bug in abstract classes generation when having cross module dependencies

## 1.1.3

### Patch Changes

- feat(abstract-classes): add support for abstract classes and inheritance

## 1.1.2

### Patch Changes

- feat(abstract-classes): add support for abstract classes and inheritance

## 1.1.1

### Patch Changes

- feat(error-handling): implement comprehensive error handling system

## 1.1.0

### Minor Changes

- Chore: docs: update package metadata and add contributing guide

## 1.0.12

### Patch Changes

- Support for splitting Modules into multiple files

## 1.0.11

### Patch Changes

- feat: enhance dependency tracking with import paths and concrete class access

## 1.0.10

### Patch Changes

- refactor(ioc-maker-cli): improve module name sanitization and merge containers

## 1.0.9

### Patch Changes

- feat(ioc): add name collision handling with import aliases

## 1.0.8

### Patch Changes

- Refactor: Deleting the flat module generation for maintainability purposes, if no modules are specified all the classes get grouped into a core module. Refactoring the generator architecture.

## 1.0.7

### Patch Changes

- refactor(ioc): extract shared instantiation and dependency resolution utilities

## 1.0.6

### Patch Changes

- Refactor the module container generator.

## 1.0.5

### Patch Changes

- Bug Fix: The cli now throws errors when none injectable values: primitive types and interfaces that have no methods.

## 1.0.4

### Patch Changes

- Bug fix: include classes that have at least one dependency

## 1.0.3

### Patch Changes

- Throwing an error when an interface is implemented by two classes

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
