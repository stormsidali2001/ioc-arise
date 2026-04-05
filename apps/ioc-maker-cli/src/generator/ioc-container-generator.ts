import { ClassInfo, DependencyInfo, FactoryInfo, ValueInfo } from '../types';
import { relative, dirname, join, basename } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { TypeDeclarationGenerator } from './type-declaration-generator';
import { ErrorFactory } from '../errors/errorFactory';
import { TsConfigPathsResolver } from '../utils/tsConfigPathsResolver';

export class IoCContainerGenerator {
    /**
     * Generates the IoC container code for the given classes
     * @param classes - Analyzed classes to be registered (can be flat or grouped)
     * @param outputPath - Path where the container file will be generated
     * @param moduleGroupedClasses - Optional: Classes grouped by modules
     * @param factories - Optional: Factory functions to be registered
     * @param values - Optional: Plain object values to be registered with useValue
     */
    static generate(
        classes: ClassInfo[],
        outputPath: string,
        moduleGroupedClasses?: Map<string, ClassInfo[]>,
        factories?: FactoryInfo[],
        values?: ValueInfo[],
        moduleGroupedFactories?: Map<string, FactoryInfo[]>,
        moduleGroupedValues?: Map<string, ValueInfo[]>,
        pathsResolver?: TsConfigPathsResolver,
        isModular?: boolean
    ): string[] {
        const generatedFiles: string[] = [];
        // Check for name collisions before generating
        // If moduleGroupedClasses is provided, check all classes from all modules
        const allClassesToCheck = moduleGroupedClasses && moduleGroupedClasses.size > 0
            ? Array.from(moduleGroupedClasses.values()).flat()
            : classes;
        this.checkForNameCollisions(allClassesToCheck);

        // Ensure directory exists
        const outputDir = dirname(outputPath);
        mkdirSync(outputDir, { recursive: true });

        if (isModular) {
            // Generate modular code with separate files for each module
            const modularFiles = this.generateModularFiles(moduleGroupedClasses ?? new Map(), outputPath, factories, values, moduleGroupedFactories, moduleGroupedValues);
            generatedFiles.push(...modularFiles);
        } else {
            // Generate single flat file
            const containerCode = this.generateFlatCode(classes, outputPath, factories, values);
            writeFileSync(outputPath, containerCode);
            generatedFiles.push(outputPath);
        }

        // Generate type declarations (.d.ts file)
        const typesPath = outputPath.endsWith('.gen.ts')
            ? outputPath.replace(/\.gen\.ts$/, '.gen.d.ts')
            : outputPath.replace(/\.ts$/, '.d.ts');
        TypeDeclarationGenerator.generate(classes, typesPath, factories, values, pathsResolver);
        generatedFiles.push(typesPath);

        return generatedFiles;
    }

    private static generateFlatCode(classes: ClassInfo[], outputPath: string, factories?: FactoryInfo[], values?: ValueInfo[]): string {
        // Collect all interface names to identify which dependencies should use string tokens
        const interfaceNames = new Set<string>();
        classes.forEach(cls => {
            if (cls.interfaceName) {
                interfaceNames.add(cls.interfaceName);
            }
        });
        // Also add interface names from instance factories and factory tokens
        if (factories) {
            factories.forEach(factory => {
                if (factory.instanceFactoryFor) {
                    interfaceNames.add(factory.instanceFactoryFor);
                }
                const token = factory.token || factory.name;
                if (token) interfaceNames.add(token);
            });
        }
        // Add value tokens — values are always registered as string tokens, so any dependency
        // on a value interface/name must also use a string token
        if (values) {
            values.forEach(value => {
                const token = value.token || value.interfaceName || value.name;
                if (token) interfaceNames.add(token);
            });
        }

        // Collect abstract class names from dependencies
        const abstractClassNames = new Set<string>();
        classes.forEach(cls => {
            cls.dependencies.forEach(dep => {
                const isInCurrentClasses = classes.some(c => c.name === dep.name);
                const looksLikeAbstractClass = dep.name.startsWith('Abstract') || dep.name.includes('Abstract');
                if (!isInCurrentClasses && looksLikeAbstractClass) {
                    abstractClassNames.add(dep.name);
                }
            });
        });

        // Collect concrete class names — a dep whose name matches a registered class is
        // referenced by its constructor (not a string token).  Everything else (interfaces,
        // external types, factories, values) uses a string token.
        const classNames = new Set(classes.map(c => c.name));

        const imports = this.generateImports(classes, outputPath, factories, values, classes, interfaceNames, abstractClassNames);
        const classRegistrations = this.generateRegistrations(classes, interfaceNames, '', abstractClassNames, classNames);
        const factoryRegistrations = factories && factories.length > 0
            ? this.generateFactoryRegistrations(factories, interfaceNames, '', abstractClassNames, classNames)
            : '';
        const valueRegistrations = values && values.length > 0
            ? this.generateValueRegistrations(values, '')
            : '';

        const filename = outputPath.split('/').pop()?.replace(/\.ts$/, '') || 'container.gen';

        const dtsFilename = outputPath.split('/').pop()?.replace(/\.ts$/, '.d') || 'container.gen.d';

        const allRegistrations = [
            classRegistrations,
            factoryRegistrations,
            valueRegistrations
        ].filter(Boolean).join('\n\n');

        return `/**
 * This file is auto-generated by ioc-arise.
 * Do not modify this file manually.
 */
import { Container, Lifecycle } from '@notjustcoders/di-container';
import type { ContainerRegistry } from './${dtsFilename}';
${imports}

export const container = new Container<ContainerRegistry>();

${allRegistrations}
`;
    }

    private static generateModularFiles(
        moduleGroupedClasses: Map<string, ClassInfo[]>,
        outputPath: string,
        _factories?: FactoryInfo[],
        _values?: ValueInfo[],
        moduleGroupedFactories?: Map<string, FactoryInfo[]>,
        moduleGroupedValues?: Map<string, ValueInfo[]>
    ): string[] {
        const generatedFiles: string[] = [];
        const outputDir = dirname(outputPath);
        const baseFilename = basename(outputPath, '.ts');
        const modulesDir = join(outputDir, 'modules');

        // Create modules directory
        mkdirSync(modulesDir, { recursive: true });

        // Collect all interface names and class names across all modules
        const allClasses = Array.from(moduleGroupedClasses.values()).flat();
        const classNames = new Set(allClasses.map(c => c.name));
        const interfaceNames = new Set<string>();
        allClasses.forEach(cls => {
            if (cls.interfaceName) {
                interfaceNames.add(cls.interfaceName);
            }
        });
        // Also add interface names from instance factories and factory tokens
        if (moduleGroupedFactories) {
            moduleGroupedFactories.forEach(moduleFactories => {
                moduleFactories.forEach(factory => {
                    if (factory.instanceFactoryFor) {
                        interfaceNames.add(factory.instanceFactoryFor);
                    }
                    const token = factory.token || factory.name;
                    if (token) interfaceNames.add(token);
                });
            });
        }
        // Add value tokens so dependencies on values use string tokens
        if (moduleGroupedValues) {
            moduleGroupedValues.forEach(moduleValues => {
                moduleValues.forEach(value => {
                    const token = value.token || value.interfaceName || value.name;
                    if (token) interfaceNames.add(token);
                });
            });
        }

        // Collect the union of all module names (a module may have only factories/values, no classes)
        const allModuleNames = new Set<string>([
            ...moduleGroupedClasses.keys(),
            ...(moduleGroupedFactories?.keys() ?? []),
            ...(moduleGroupedValues?.keys() ?? []),
        ]);

        // Generate each module file
        const moduleImports: string[] = [];
        const moduleNames: string[] = [];
        for (const moduleName of allModuleNames) {
            const classes = moduleGroupedClasses.get(moduleName) ?? [];
            const moduleFactories = moduleGroupedFactories?.get(moduleName);
            const moduleValues = moduleGroupedValues?.get(moduleName);

            const moduleFilename = `${moduleName.charAt(0).toLowerCase() + moduleName.slice(1)}.module.ts`;
            const moduleFilePath = join(modulesDir, moduleFilename);
            const moduleCode = this.generateModuleFile(moduleName, classes, interfaceNames, moduleFilePath, moduleFactories, moduleValues, allClasses, classNames);

            writeFileSync(moduleFilePath, moduleCode);
            generatedFiles.push(moduleFilePath);

            // Add import for main container file
            const moduleVarName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
            moduleImports.push(`import { ${moduleVarName} } from './modules/${moduleFilename.replace('.ts', '')}';`);
            moduleNames.push(moduleName);
        }

        // Generate main container file
        const dtsFilename = baseFilename.replace(/\.gen$/, '.gen.d');
        const mainContainerCode = this.generateMainContainerFile(allModuleNames, moduleImports, dtsFilename);
        writeFileSync(outputPath, mainContainerCode);
        generatedFiles.push(outputPath);

        return generatedFiles;
    }

    private static generateModuleFile(
        moduleName: string,
        classes: ClassInfo[],
        interfaceNames: Set<string>,
        moduleFilePath: string,
        factories?: FactoryInfo[],
        values?: ValueInfo[],
        allClasses: ClassInfo[] = [],
        classNames: Set<string> = new Set()
    ): string {
        // Collect abstract class names that are dependencies
        const abstractClassNames = new Set<string>();
        classes.forEach(cls => {
            cls.dependencies.forEach(dep => {
                const isInCurrentModule = classes.some(c => c.name === dep.name);
                const looksLikeAbstractClass = dep.name.startsWith('Abstract') || dep.name.includes('Abstract');
                if (!isInCurrentModule && looksLikeAbstractClass) {
                    abstractClassNames.add(dep.name);
                }
            });
        });

        const imports = this.generateImports(classes, moduleFilePath, factories, values, allClasses, interfaceNames, abstractClassNames);

        const classRegistrations = this.generateModuleRegistrations(classes, interfaceNames, abstractClassNames, classNames);
        const factoryRegistrations = factories && factories.length > 0
            ? this.generateModuleFactoryRegistrations(factories, interfaceNames, abstractClassNames, classNames)
            : '';
        const valueRegistrations = values && values.length > 0
            ? this.generateModuleValueRegistrations(values)
            : '';

        const allRegistrations = [classRegistrations, factoryRegistrations, valueRegistrations]
            .filter(Boolean)
            .join('\n');

        const moduleVarName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);

        return `/**
 * This file is auto-generated by ioc-arise.
 * Do not modify this file manually.
 *
 * Module: ${moduleName}
 */
import { ContainerModule, Lifecycle } from '@notjustcoders/di-container';
${imports}

export const ${moduleVarName} = new ContainerModule()
${allRegistrations};
`;
    }

    private static generateModuleFactoryRegistrations(
        factories: FactoryInfo[],
        interfaceNames: Set<string>,
        abstractClassNames: Set<string> = new Set(),
        classNames: Set<string> = new Set()
    ): string {
        return factories.map(factory => {
            const token = factory.token ? `'${factory.token}'` : `'${factory.name}'`;

            const dependencies = factory.dependencies.length > 0
                ? `, dependencies: [${factory.dependencies.map(dep => {
                    if (interfaceNames.has(dep.name)) return `'${dep.name}'`;
                    if (abstractClassNames.has(dep.name)) return `'${dep.name}'`;
                    if (classNames.has(dep.name)) return dep.name;
                    return `'${dep.name}'`;
                }).join(', ')}]`
                : '';

            const lifecycle = factory.scope === 'singleton' ? 'Lifecycle.Singleton' : 'Lifecycle.Transient';

            let factoryFunction: string;
            if (factory.useContextObject && factory.contextObjectProperties) {
                const depParams = factory.dependencies.map((_, index) => {
                    return factory.contextObjectProperties?.[index]?.name || `dep${index}`;
                }).join(', ');
                const contextObject = factory.contextObjectProperties.map(prop => prop.name).join(', ');
                factoryFunction = `(${depParams}) => ${factory.name}({ ${contextObject} })`;
            } else {
                factoryFunction = factory.name;
            }

            return `  .register(${token}, { useFactory: ${factoryFunction}${dependencies}, lifecycle: ${lifecycle} })`;
        }).join('\n');
    }

    private static generateModuleValueRegistrations(values: ValueInfo[]): string {
        return values.map(value => {
            const token = value.token
                ? `'${value.token}'`
                : value.interfaceName
                    ? `'${value.interfaceName}'`
                    : `'${value.name}'`;
            return `  .register(${token}, { useValue: ${value.name}, lifecycle: Lifecycle.Singleton })`;
        }).join('\n');
    }

    private static generateMainContainerFile(
        moduleNames: Set<string> | Map<string, ClassInfo[]>,
        moduleImports: string[],
        dtsFilename: string
    ): string {
        const moduleInstantiations = Array.from(moduleNames.keys())
            .map(name => {
                const varName = name.charAt(0).toLowerCase() + name.slice(1);
                return `container.registerModule(${varName});`;
            })
            .join('\n');

        return `/**
 * This file is auto-generated by ioc-arise.
 * Do not modify this file manually.
 */
import { Container } from '@notjustcoders/di-container';
import type { ContainerRegistry } from './${dtsFilename}';
${moduleImports.join('\n')}

export const container = new Container<ContainerRegistry>();

${moduleInstantiations}
`;
    }

    private static generateModularCode(
        moduleGroupedClasses: Map<string, ClassInfo[]>,
        outputPath: string,
        factories?: FactoryInfo[],
        values?: ValueInfo[]
    ): string {
        const allClasses = Array.from(moduleGroupedClasses.values()).flat();

        // Collect all interface names
        const interfaceNames = new Set<string>();
        allClasses.forEach(cls => {
            if (cls.interfaceName) {
                interfaceNames.add(cls.interfaceName);
            }
        });

        // Also add factory tokens
        if (factories) {
            factories.forEach(factory => {
                if (factory.instanceFactoryFor) {
                    interfaceNames.add(factory.instanceFactoryFor);
                }
                const token = factory.token || factory.name;
                if (token) interfaceNames.add(token);
            });
        }

        // Add value tokens
        if (values) {
            values.forEach(value => {
                const token = value.token || value.interfaceName || value.name;
                if (token) interfaceNames.add(token);
            });
        }

        // Collect abstract class names from dependencies
        const abstractClassNames = new Set<string>();
        allClasses.forEach(cls => {
            cls.dependencies.forEach(dep => {
                const isInCurrentClasses = allClasses.some(c => c.name === dep.name);
                const looksLikeAbstractClass = dep.name.startsWith('Abstract') || dep.name.includes('Abstract');
                if (!isInCurrentClasses && looksLikeAbstractClass) {
                    abstractClassNames.add(dep.name);
                }
            });
        });

        const imports = this.generateImports(allClasses, outputPath, undefined, undefined, allClasses, interfaceNames, abstractClassNames);
        const moduleDefinitions = this.generateModuleDefinitions(moduleGroupedClasses, interfaceNames, abstractClassNames);
        const moduleInstantiations = this.generateModuleInstantiations(moduleGroupedClasses);

        const filename = outputPath.split('/').pop()?.replace(/\.ts$/, '') || 'container.gen';

        const dtsFilename = outputPath.split('/').pop()?.replace(/\.ts$/, '.d') || 'container.gen.d';

        return `/**
 * This file is auto-generated by ioc-arise.
 * Do not modify this file manually.
 */
import { Container, ContainerModule, Lifecycle } from '@notjustcoders/di-container';
import type { ContainerRegistry } from './${dtsFilename}';
${imports}

${moduleDefinitions}

export const container = new Container<ContainerRegistry>();

${moduleInstantiations}
`;
    }

    private static generateModuleDefinitions(
        moduleGroupedClasses: Map<string, ClassInfo[]>,
        interfaceNames: Set<string>,
        abstractClassNames: Set<string> = new Set()
    ): string {
        const modules: string[] = [];

        for (const [moduleName, classes] of moduleGroupedClasses.entries()) {
            const registrations = this.generateModuleRegistrations(classes, interfaceNames, abstractClassNames);

            modules.push(`const ${moduleName.charAt(0).toLowerCase() + moduleName.slice(1)} = new ContainerModule()
${registrations};`);
        }

        return modules.join('\n\n');
    }

    private static generateModuleInstantiations(
        moduleGroupedClasses: Map<string, ClassInfo[]>
    ): string {
        const moduleNames = Array.from(moduleGroupedClasses.keys());
        const instantiations = moduleNames.map(name => {
            const varName = name.charAt(0).toLowerCase() + name.slice(1);
            return `container.registerModule(${varName});`;
        });

        return instantiations.join('\n');
    }

    private static generateModuleRegistrations(
        classes: ClassInfo[],
        interfaceNames: Set<string>,
        abstractClassNames: Set<string> = new Set(),
        classNames: Set<string> = new Set()
    ): string {
        return classes.map(cls => {
            // Determine registration token
            const token = cls.interfaceName
                ? `'${cls.interfaceName}'`
                : cls.abstractClassName
                    ? `'${cls.abstractClassName}'`
                    : cls.name;

            // Generate dependencies array
            const dependencies = cls.dependencies.length > 0
                ? `, dependencies: [${cls.dependencies.map(dep => {
                    if (interfaceNames.has(dep.name)) return `'${dep.name}'`;
                    if (abstractClassNames.has(dep.name)) return `'${dep.name}'`;
                    if (classNames.has(dep.name)) return dep.name;
                    return `'${dep.name}'`;
                }).join(', ')}]`
                : '';

            // Determine lifecycle enum value
            const lifecycle = cls.scope === 'singleton'
                ? 'Lifecycle.Singleton'
                : 'Lifecycle.Transient';

            return `  .register(${token}, { useClass: ${cls.name}${dependencies}, lifecycle: ${lifecycle} })`;
        }).join('\n');
    }

    private static generateImports(
        classes: ClassInfo[],
        outputPath: string,
        factories?: FactoryInfo[],
        values?: ValueInfo[],
        allProjectClasses: ClassInfo[] = [],
        interfaceNames: Set<string> = new Set(),
        abstractClassNames: Set<string> = new Set()
    ): string {
        const outputDir = dirname(outputPath);
        const importStatements: string[] = [];
        const importMap = new Map<string, Set<string>>();

        // Helper to add an import to the map
        const addImportToMap = (filePath: string, name: string) => {
            // Calculate relative path from output file to file
            let relativePath = relative(outputDir, filePath);

            // Remove extension (.ts)
            relativePath = relativePath.replace(/\.ts$/, '');

            // Add ./ if it doesn't start with . or /
            if (!relativePath.startsWith('.')) {
                relativePath = `./${relativePath}`;
            }

            // Use forward slashes for imports
            relativePath = relativePath.replace(/\\/g, '/');

            if (!importMap.has(relativePath)) {
                importMap.set(relativePath, new Set());
            }
            importMap.get(relativePath)!.add(name);
        };

        // Collect class imports
        classes.forEach(cls => {
            addImportToMap(cls.filePath, cls.name);
        });

        // Collect factory imports
        if (factories) {
            factories.forEach(factory => {
                addImportToMap(factory.filePath, factory.name);
            });
        }

        // Collect value imports
        if (values) {
            values.forEach(value => {
                addImportToMap(value.filePath, value.name);
            });
        }

        // Collect dependencies that need class token imports
        // (those not registered as string tokens via interfaces or abstract classes)
        const allEntities = [...classes, ...(factories || [])];
        const registeredNamesInModule = new Set([
            ...classes.map(c => c.name),
            ...(factories?.map(f => f.name) ?? []),
            ...(values?.map(v => v.name) ?? [])
        ]);

        allEntities.forEach(entity => {
            entity.dependencies.forEach(dep => {
                // Skip if it's already registered in this module, or if it's a string token
                // (registered via interfaces, abstract classes, factories or values)
                if (registeredNamesInModule.has(dep.name) ||
                    interfaceNames.has(dep.name) ||
                    abstractClassNames.has(dep.name)) {
                    return;
                }

                // If it's a project class, import it using its actual file path
                const depClass = allProjectClasses.find(c => c.name === dep.name);
                if (depClass) {
                    addImportToMap(depClass.filePath, depClass.name);
                }
                // Note: If not found in project classes, it might be an external dependency.
                // For now we don't handle external class token imports as we don't have their absolute paths.
            });
        });

        // Generate import statements
        for (const [importPath, names] of importMap.entries()) {
            const namesArray = Array.from(names).sort();
            importStatements.push(`import { ${namesArray.join(', ')} } from '${importPath}';`);
        }

        return importStatements.join('\n');
    }

    /**
     * Checks for class name collisions and throws an error if any are found
     */
    private static checkForNameCollisions(classes: ClassInfo[]): void {
        const nameToClasses = new Map<string, ClassInfo[]>();

        classes.forEach(cls => {
            if (!nameToClasses.has(cls.name)) {
                nameToClasses.set(cls.name, []);
            }
            nameToClasses.get(cls.name)!.push(cls);
        });

        // Check for collisions
        for (const [className, classesWithSameName] of nameToClasses.entries()) {
            if (classesWithSameName.length > 1) {
                const filePaths = classesWithSameName.map(cls => cls.filePath);
                throw ErrorFactory.classNameCollision(className, filePaths);
            }
        }
    }


    private static generateRegistrations(
        classes: ClassInfo[],
        interfaceNames: Set<string>,
        indent: string = '',
        abstractClassNames: Set<string> = new Set(),
        classNames: Set<string> = new Set()
    ): string {
        return classes.map(cls => {
            // Determine registration token:
            // - If implements interface, use string token of interface name
            // - If extends abstract class, use string token of abstract class name
            // - Otherwise, use class constructor
            const token = cls.interfaceName
                ? `'${cls.interfaceName}'`
                : cls.abstractClassName
                    ? `'${cls.abstractClassName}'`
                    : cls.name;

            // Generate dependencies array
            const dependencies = cls.dependencies.length > 0
                ? `\n${indent}  dependencies: [${cls.dependencies.map(dep => {
                    if (interfaceNames.has(dep.name)) return `'${dep.name}'`;
                    if (abstractClassNames.has(dep.name)) return `'${dep.name}'`;
                    if (classNames.has(dep.name)) return dep.name;
                    return `'${dep.name}'`;
                }).join(', ')}],`
                : '';

            // Determine lifecycle enum value
            const lifecycle = cls.scope === 'singleton'
                ? 'Lifecycle.Singleton'
                : 'Lifecycle.Transient';

            return `${indent}container.register(${token}, {
${indent}  useClass: ${cls.name},${dependencies}
${indent}  lifecycle: ${lifecycle},
${indent}});`;
        }).join('\n\n');
    }

    private static generateFactoryRegistrations(
        factories: FactoryInfo[],
        interfaceNames: Set<string>,
        indent: string = '',
        abstractClassNames: Set<string> = new Set(),
        classNames: Set<string> = new Set()
    ): string {
        return factories.map(factory => {
            // Use token if provided, otherwise use function name directly
            const token = factory.token
                ? `'${factory.token}'`
                : `'${factory.name}'`;

            // Generate dependencies array
            const dependencies = factory.dependencies.length > 0
                ? `\n${indent}  dependencies: [${factory.dependencies.map(dep => {
                    if (interfaceNames.has(dep.name)) return `'${dep.name}'`;
                    if (abstractClassNames.has(dep.name)) return `'${dep.name}'`;
                    if (classNames.has(dep.name)) return dep.name;
                    return `'${dep.name}'`;
                }).join(', ')}],`
                : '';

            // Determine lifecycle enum value
            const lifecycle = factory.scope === 'singleton'
                ? 'Lifecycle.Singleton'
                : 'Lifecycle.Transient';

            // Generate factory function - wrap if context object pattern is used
            let factoryFunction: string;
            if (factory.useContextObject && factory.contextObjectProperties) {
                // Generate wrapper function that passes dependencies as context object
                const contextProps = factory.contextObjectProperties.map(prop => prop.name).join(', ');
                const contextObject = factory.contextObjectProperties.map(prop => `${prop.name}`).join(', ');
                const depParams = factory.dependencies.map((_, index) => {
                    const propName = factory.contextObjectProperties?.[index]?.name || `dep${index}`;
                    return propName;
                }).join(', ');

                factoryFunction = `(${depParams}) => ${factory.name}({ ${contextObject} })`;
            } else {
                // Use factory directly (existing behavior)
                factoryFunction = factory.name;
            }

            return `${indent}container.register(${token}, {
${indent}  useFactory: ${factoryFunction},${dependencies}
${indent}  lifecycle: ${lifecycle},
${indent}});`;
        }).join('\n\n');
    }

    private static generateValueRegistrations(
        values: ValueInfo[],
        indent: string = ''
    ): string {
        return values.map(value => {
            // Use token if provided, otherwise use interface name or value name
            const token = value.token
                ? `'${value.token}'`
                : value.interfaceName
                    ? `'${value.interfaceName}'`
                    : `'${value.name}'`;

            const lifecycle = value.scope === 'singleton'
                ? 'Lifecycle.Singleton'
                : 'Lifecycle.Transient';

            return `${indent}container.register(${token}, {
${indent}  useValue: ${value.name},
${indent}  lifecycle: ${lifecycle},
${indent}});`;
        }).join('\n\n');
    }
}
