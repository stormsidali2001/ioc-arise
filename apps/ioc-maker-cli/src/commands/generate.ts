import { Command } from "commander";
import { resolve } from "path";
import { existsSync } from "fs";
import { analyzeProject, analyzeProjectWithFactories } from "../analyser";
import { IoCContainerGenerator } from "../generator";
import { CircularDependencyDetector } from "../utils/circular-dependency-detector";
import { ConfigManager } from "../utils/configManager";
import { ConfigValidator } from "../utils/configValidator";
import { ErrorFactory } from "../errors/errorFactory";
import { ErrorUtils } from "../errors/IoCError";
import { ModuleResolver } from "../utils/moduleResolver";
import { TsConfigPathsResolver } from "../utils/tsConfigPathsResolver";
import { Logger } from "../utils/logger";
import { ClassInfo, FactoryInfo, ValueInfo } from "../types";

export const generateCommand = new Command("generate")
  .description("Generate IoC container from TypeScript classes")
  .option("-s, --source <dir>", "Source directory to scan")
  .option("-o, --output <file>", "Output file path")
  .option(
    "-i, --interface <pattern>",
    "Interface name pattern to match (regex)",
  )
  .option("-e, --exclude <patterns...>", "Exclude patterns for files")
  .option(
    "--factory-pattern <pattern>",
    "Factory function name pattern to match (regex). Default: functions with @factory JSDoc comment",
  )
  .option(
    "--value-pattern <pattern>",
    "Value name pattern to match (regex). Default: values with @value JSDoc comment",
  )
  .option(
    "--check-cycles",
    "Only check for circular dependencies without generating",
  )
  .option("--verbose", "Enable verbose logging")
  .action(async (options) => {
    try {
      // Initialize logger
      Logger.initialize({ verbose: options.verbose ?? false });

      // Initialize config manager with the source directory
      const initialSourceDir = resolve(options.source || ".");
      const configManager = new ConfigManager(initialSourceDir);

      // Validate config if present
      if (configManager.hasConfigFile()) {
        const config = configManager.getConfig();
        if (
          !ConfigValidator.validateAndLog(config, configManager.getConfigPath())
        ) {
          process.exit(1);
        }
      }

      // Merge CLI options with config file
      const mergedOptions = configManager.mergeWithCliOptions(options);

      const sourceDir = resolve(mergedOptions.source!);
      const outputPath = resolve(initialSourceDir, mergedOptions.output!);

      if (configManager.hasConfigFile() && mergedOptions.verbose) {
        Logger.info(`Using config file: ${configManager.getConfigPath()}`);
      }

      // Initialize module resolver if modules are configured
      let moduleResolver: ModuleResolver | null = null;
      if (
        mergedOptions.modules &&
        Object.keys(mergedOptions.modules).length > 0
      ) {
        moduleResolver = new ModuleResolver(mergedOptions.modules, sourceDir);
        if (mergedOptions.verbose) {
          Logger.info(
            `Module support enabled with ${Object.keys(mergedOptions.modules).length} modules`,
          );
        }
      }

      if (!existsSync(sourceDir)) {
        const error = ErrorFactory.sourceDirectoryNotFound(sourceDir);
        Logger.error(ErrorUtils.formatForConsole(error));
        process.exit(1);
      }

      if (mergedOptions.verbose) {
        Logger.info(`Scanning directory: ${sourceDir}`);
        Logger.info(`Output file: ${outputPath}`);
        if (mergedOptions.interface) {
          Logger.info(`Interface pattern: ${mergedOptions.interface}`);
        }
      }

      Logger.custom(
        "🚀",
        "Starting analysis...",
        Logger.getColors().cyan + Logger.getColors().bright,
      );
      // Analyze the project (including factories)
      const { classes, factories, values } = await analyzeProjectWithFactories(
        sourceDir,
        {
          sourceDir,
          interfacePattern: mergedOptions.interface,
          excludePatterns: mergedOptions.exclude,
          factoryPattern: mergedOptions.factoryPattern,
          valuePattern: mergedOptions.valuePattern,
        },
      );

      // Check if we have anything to generate
      if (
        classes.length === 0 &&
        (!factories || factories.length === 0) &&
        (!values || values.length === 0)
      ) {
        const error = ErrorFactory.noClassesFound(
          mergedOptions.interface || 'interfaces with "implements" keyword',
        );
        Logger.error(ErrorUtils.formatForConsole(error));
        Logger.error(
          "No classes, factories, or values found to generate a container.",
        );
        process.exit(1);
        return;
      }

      // Group everything by module
      let moduleGroupedClasses: Map<string, ClassInfo[]> | undefined;
      let moduleGroupedFactories: Map<string, FactoryInfo[]> | undefined;
      let moduleGroupedValues: Map<string, ValueInfo[]> | undefined;

      if (moduleResolver) {
        if (classes.length > 0) {
          moduleGroupedClasses = moduleResolver.groupClassesByModule(classes);
        }
        if (factories && factories.length > 0) {
          moduleGroupedFactories =
            moduleResolver.groupFactoriesByModule(factories);
        }
        if (values && values.length > 0) {
          moduleGroupedValues = moduleResolver.groupValuesByModule(values);
        }
      } else {
        if (classes.length > 0) {
          moduleGroupedClasses = new Map([["CoreModule", classes]]);
        }
      }

      // Print structured analysis summary
      Logger.newline();
      printAnalysisSummary(
        moduleResolver !== null,
        moduleGroupedClasses,
        moduleGroupedFactories,
        moduleGroupedValues,
        classes,
        factories,
        values,
        mergedOptions.verbose ?? false,
      );
      Logger.newline();

      // Check for circular dependencies between classes
      const cycles = CircularDependencyDetector.detect(classes);
      if (cycles.length > 0) {
        const firstCycle = cycles[0];
        if (firstCycle && firstCycle.length > 0) {
          const className = firstCycle[0] || "unknown";
          const error = ErrorFactory.circularDependency(className, firstCycle);
          Logger.error(ErrorUtils.formatForConsole(error));

          if (cycles.length > 1) {
            Logger.log("\n   Additional cycles:");
            cycles.slice(1).forEach((cycle, index) => {
              Logger.log(`   ${index + 2}. ${cycle.join(" → ")}`);
            });
          }
        } else {
          Logger.error(
            "Circular dependencies detected but cycle information is incomplete",
          );
        }
        process.exit(1);
      }

      // Check for circular dependencies between modules
      if (
        moduleGroupedClasses &&
        moduleGroupedClasses.size > 1 &&
        classes.length > 0
      ) {
        const moduleCycles =
          CircularDependencyDetector.detectModuleCycles(moduleGroupedClasses);
        if (moduleCycles.length > 0) {
          Logger.error("Circular dependencies detected between modules:");
          moduleCycles.forEach((cycle, index) => {
            if (cycle.length > 0) {
              // The cycle already includes the starting node at the end from TopologicalSorter
              const cycleDisplay = cycle.join(" → ");
              Logger.log(`   ${index + 1}. ${cycleDisplay}`);
            }
          });
          Logger.log(
            "\n   Module dependencies must form a directed acyclic graph (DAG).",
          );
          Logger.log(
            "   Consider refactoring to break the circular dependency or merging the modules.",
          );
          process.exit(1);
        }
      }

      if (mergedOptions.checkCycles) {
        Logger.success("No circular dependencies found (classes or modules).");
        process.exit(0);
        return;
      }

      // Generate container file
      Logger.custom(
        "🚀",
        "Generating container...",
        Logger.getColors().cyan + Logger.getColors().bright,
      );
      const pathsResolver = new TsConfigPathsResolver(sourceDir);
      IoCContainerGenerator.generate(
        classes,
        outputPath,
        moduleGroupedClasses,
        factories,
        values,
        moduleGroupedFactories,
        moduleGroupedValues,
        pathsResolver,
        moduleResolver !== null,
      );

      const statParts: string[] = [];
      if (classes.length > 0)
        statParts.push(
          `${classes.length} class${classes.length !== 1 ? "es" : ""}`,
        );
      if (factories && factories.length > 0)
        statParts.push(
          `${factories.length} factor${factories.length !== 1 ? "ies" : "y"}`,
        );
      if (values && values.length > 0)
        statParts.push(
          `${values.length} value${values.length !== 1 ? "s" : ""}`,
        );
      if (moduleResolver) {
        const moduleCount = new Set([
          ...(moduleGroupedClasses?.keys() ?? []),
          ...(moduleGroupedFactories?.keys() ?? []),
          ...(moduleGroupedValues?.keys() ?? []),
        ]).size;
        statParts.unshift(
          `${moduleCount} module${moduleCount !== 1 ? "s" : ""}`,
        );
      }

      Logger.success("Container generated successfully!");
      Logger.log(
        Logger.colorizeText(`   📁 ${outputPath}`, Logger.getColors().gray),
      );
      Logger.log(
        Logger.colorizeText(
          `   ${statParts.join(" · ")}`,
          Logger.getColors().gray,
        ),
      );

      process.exit(0);
    } catch (error) {
      if (ErrorUtils.isIoCError(error)) {
        Logger.error(ErrorUtils.formatForConsole(error));
      } else {
        const wrappedError = ErrorFactory.unexpectedError(error as Error);
        Logger.error(ErrorUtils.formatForConsole(wrappedError));
      }
      process.exit(1);
    }
  });

function printAnalysisSummary(
  isModular: boolean,
  moduleGroupedClasses: Map<string, ClassInfo[]> | undefined,
  moduleGroupedFactories: Map<string, FactoryInfo[]> | undefined,
  moduleGroupedValues: Map<string, ValueInfo[]> | undefined,
  classes: ClassInfo[],
  factories: FactoryInfo[] | undefined,
  values: ValueInfo[] | undefined,
  _verbose: boolean,
): void {
  const c = Logger.getColors();

  const printClass = (cls: ClassInfo, indent: string) => {
    const name = Logger.colorizeText(`${indent}🏗️  ${cls.name}`, c.white);
    if (cls.interfaceName) {
      Logger.log(
        name +
          Logger.colorizeText(" ──implements──▶ ", c.gray) +
          Logger.colorizeText(cls.interfaceName, c.green),
      );
    } else if (cls.abstractClassName) {
      Logger.log(
        name +
          Logger.colorizeText(" ──extends──▶ ", c.gray) +
          Logger.colorizeText(cls.abstractClassName, c.green),
      );
    } else {
      Logger.log(name);
    }
    if (cls.dependencies.length > 0) {
      const deps = cls.dependencies.map((d) => d.name).join(", ");
      Logger.log(
        Logger.colorizeText(`${indent}   deps: `, c.gray) +
          Logger.colorizeText(deps, c.yellow),
      );
    }
  };
  const printFactory = (factory: FactoryInfo, indent: string) => {
    if (factory.instanceFactoryFor) {
      Logger.log(
        Logger.colorizeText(`${indent}🔌 ${factory.name}()`, c.white) +
          Logger.colorizeText(" ──returns──▶ ", c.gray) +
          Logger.colorizeText(factory.instanceFactoryFor, c.green),
      );
    } else {
      const token = factory.token || factory.name;
      Logger.log(
        Logger.colorizeText(`${indent}🏭 ${factory.name}()`, c.white) +
          Logger.colorizeText(" ──factory──▶ ", c.gray) +
          Logger.colorizeText(`'${token}'`, c.magenta),
      );
    }
    if (factory.dependencies.length > 0) {
      const deps = factory.dependencies.map((d) => d.name).join(", ");
      Logger.log(
        Logger.colorizeText(`${indent}   deps: `, c.gray) +
          Logger.colorizeText(deps, c.yellow),
      );
    }
  };
  const printValue = (value: ValueInfo, indent: string) => {
    const label = value.interfaceName || value.token || value.name;
    Logger.log(
      Logger.colorizeText(`${indent}💎 ${value.name}`, c.white) +
        Logger.colorizeText(" ──value──▶ ", c.gray) +
        Logger.colorizeText(label, c.green),
    );
    // ValueInfo has no dependencies field, so nothing to print
  };
  if (isModular) {
    const allModuleNames = new Set<string>([
      ...(moduleGroupedClasses?.keys() ?? []),
      ...(moduleGroupedFactories?.keys() ?? []),
      ...(moduleGroupedValues?.keys() ?? []),
    ]);

    for (const moduleName of allModuleNames) {
      Logger.log(Logger.colorizeText(`📦 ${moduleName}`, c.cyan + c.bright));
      for (const cls of moduleGroupedClasses?.get(moduleName) ?? []) {
        printClass(cls, "   ");
      }
      for (const factory of moduleGroupedFactories?.get(moduleName) ?? []) {
        printFactory(factory, "   ");
      }
      for (const value of moduleGroupedValues?.get(moduleName) ?? []) {
        printValue(value, "   ");
      }
    }
  } else {
    for (const cls of classes) {
      printClass(cls, "   ");
    }
    for (const factory of factories ?? []) {
      printFactory(factory, "   ");
    }
    for (const value of values ?? []) {
      printValue(value, "   ");
    }
  }
}

