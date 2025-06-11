---
"@notjustcoders/ioc-arise": patch
---

Version 1.0 Release includes: 
* Fully type safe ioc container auto generation based on code static analysis without polluting your classes with decorators or any library imports.
* Support for classes and interfaces with cycles detection.
* Support for injection scopes (transient and singleton) via jsDoc comments.
* Support for cli default args configuration file `ioc.config.json`.
* Support module resolution with cycles detection (module are defined in `ioc.config.json`).
