import { relative } from 'path';
import { FactoryInfo, ConstructorParameter, InjectionScope, DependencyInfo } from '../types';
import { ASTParser } from './ast-parser';
import { container } from '../container';
import { DependencyResolver } from './dependency-resolver';
import { Logger } from '../utils/logger';

export class FactoryAnalyzer {
    private astParser: ASTParser;
    private sourceDir: string;
    private factoryPattern?: RegExp;

    constructor(sourceDir: string, factoryPattern?: string) {
        this.astParser = container.astParser;
        this.sourceDir = sourceDir;
        if (factoryPattern) {
            try {
                this.factoryPattern = new RegExp(factoryPattern, 'i');
            } catch (error) {
                Logger.warn(`Invalid factory pattern regex: ${factoryPattern}. Using default behavior.`);
            }
        }
    }

    async collectTokens(filePaths: string[]): Promise<{ factoryNames: Set<string>; interfaces: Set<string> }> {
        const factoryNames = new Set<string>();
        const interfaces = new Set<string>();

        for (const filePath of filePaths) {
            try {
                const root = this.astParser.parseFile(filePath);
                
                // Collect interfaces
                const extractedInterfaces = this.astParser.extractInterfaces(root);
                extractedInterfaces.forEach(i => interfaces.add(i));

                // Collect type aliases
                const typeAliases = this.astParser.extractTypeAliases(root);
                for (const [alias] of typeAliases.entries()) {
                    interfaces.add(alias);
                }

                // Collect factory names (exported functions with @factory or pattern match)
                const functionNodes = this.astParser.findAllFunctions(root);
                for (const functionNode of functionNodes) {
                    const functionName = this.astParser.extractFunctionName(functionNode);
                    if (functionName) {
                        const isExported = this.astParser.isExportedFunction(functionNode);
                        const hasFactoryAnnotation = this.hasFactoryAnnotation(root, functionNode);
                        const matchesFactoryPattern = this.factoryPattern ? this.factoryPattern.test(functionName) : false;
                        const returnType = this.astParser.extractFunctionReturnType(functionNode);
                        const instanceFactoryFor = returnType ? this.extractCoreInterfaceName(returnType, interfaces) : undefined;

                        if (isExported && (hasFactoryAnnotation || matchesFactoryPattern || instanceFactoryFor)) {
                            factoryNames.add(functionName);
                            if (instanceFactoryFor) {
                                interfaces.add(instanceFactoryFor);
                            }
                        }
                    }
                }
            } catch (error) {
                Logger.warn(`Warning: Could not collect tokens from ${filePath}:`, { error });
            }
        }

        return { factoryNames, interfaces };
    }

    async analyzeFiles(filePaths: string[], tokens?: { interfaces: Set<string>; classNames: Set<string>; factoryNames: Set<string> }): Promise<FactoryInfo[]> {
        const allFactories: FactoryInfo[] = [];
        let allInterfaces = tokens?.interfaces || new Set<string>();
        let allClassNames = tokens?.classNames || new Set<string>();
        let allFactoryNames = tokens?.factoryNames || new Set<string>();
        const fileASTMap = new Map<string, any>();

        if (!tokens) {
            // First pass: Collect types for dependency resolution
            for (const filePath of filePaths) {
                try {
                    const root = this.astParser.parseFile(filePath);
                    fileASTMap.set(filePath, root);

                    const interfaces = this.astParser.extractInterfaces(root);
                    interfaces.forEach(interfaceName => allInterfaces.add(interfaceName));

                    const classNodes = this.astParser.findAllClasses(root);
                    for (const classNode of classNodes) {
                        const className = this.astParser.extractClassName(classNode);
                        if (className) {
                            allClassNames.add(className);
                        }
                    }

                    // Collect factory names (exported functions with @factory or pattern match)
                    const functionNodes = this.astParser.findAllFunctions(root);
                    for (const functionNode of functionNodes) {
                        const functionName = this.astParser.extractFunctionName(functionNode);
                        if (functionName) {
                            const isExported = this.astParser.isExportedFunction(functionNode);
                            const hasFactoryAnnotation = this.hasFactoryAnnotation(root, functionNode);
                            const matchesFactoryPattern = this.factoryPattern ? this.factoryPattern.test(functionName) : false;
                            const returnType = this.astParser.extractFunctionReturnType(functionNode);
                            const instanceFactoryFor = returnType ? this.extractCoreInterfaceName(returnType, allInterfaces) : undefined;

                            if (isExported && (hasFactoryAnnotation || matchesFactoryPattern || instanceFactoryFor)) {
                                allFactoryNames.add(functionName);
                            }
                        }
                    }
                } catch (error) {
                    Logger.warn(`Warning: Could not parse ${filePath}:`, { error });
                }
            }
        }

        // Second pass: Analyze factory functions
        for (const filePath of filePaths) {
            let root = fileASTMap.get(filePath);
            if (!root) {
                try {
                    root = this.astParser.parseFile(filePath);
                } catch (e) {
                    continue;
                }
            }
            
            if (root) {
                const factories = await this.analyzeFileFromAST(filePath, root, allInterfaces, allClassNames, allFactoryNames);
                allFactories.push(...factories);
            }
        }

        return allFactories;
    }

    private async analyzeFileFromAST(
        filePath: string,
        root: any,
        allInterfaces: Set<string>,
        allClassNames: Set<string>,
        allFactoryNames: Set<string>
    ): Promise<FactoryInfo[]> {
        const factories: FactoryInfo[] = [];

        try {
            const importMappings = this.astParser.extractImportMappings(root);
            const jsDocScopes = this.astParser.extractJSDocComments(root);

            const functionNodes = this.astParser.findAllFunctions(root);
            Logger.debug(`Found ${functionNodes.length} function nodes in ${filePath}`);

            for (const functionNode of functionNodes) {
                const functionName = this.astParser.extractFunctionName(functionNode);
                Logger.debug(`Extracted function name: ${functionName} from node: ${functionNode.text().substring(0, 100)}`);
                if (!functionName) {
                    continue;
                }

                // Only analyze exported functions that are factories
                // Factory functions are detected by:
                // 1. @factory JSDoc comment (default behavior)
                // 2. Function name matching factoryPattern regex (if configured)
                const isExported = this.astParser.isExportedFunction(functionNode);
                const hasFactoryAnnotation = this.hasFactoryAnnotation(root, functionNode);
                const matchesFactoryPattern = this.factoryPattern ? this.factoryPattern.test(functionName) : false;

                // Detect instance factories: exported functions with an explicit return type
                // matching a known interface (e.g., ): IUserRepository {)
                const returnType = this.astParser.extractFunctionReturnType(functionNode);
                const instanceFactoryFor = returnType
                    ? this.extractCoreInterfaceName(returnType, allInterfaces)
                    : undefined;

                Logger.debug(`Function ${functionName}: isExported=${isExported}, hasFactoryAnnotation=${hasFactoryAnnotation}, matchesFactoryPattern=${matchesFactoryPattern}, instanceFactoryFor=${instanceFactoryFor}`);
                if (!isExported || (!hasFactoryAnnotation && !matchesFactoryPattern && !instanceFactoryFor)) {
                    Logger.debug(`Skipping function ${functionName}`);
                    continue;
                }

                const parameters = this.astParser.extractFunctionParameters(functionNode);
                // Instance factories default to transient (they produce new instances on demand).
                // Regular @factory / pattern-matched factories default to singleton.
                // Either default can be overridden with /** @scope transient|singleton */
                const defaultScope: InjectionScope = instanceFactoryFor ? 'transient' : 'singleton';
                const scope = jsDocScopes.get(functionName) || defaultScope;

                // Check if this is a context object pattern (single parameter with object type)
                const isContextObjectPattern = parameters.length === 1 &&
                    parameters[0] !== undefined &&
                    parameters[0].type.startsWith('{') &&
                    parameters[0].type.includes(':');

                let dependencies: DependencyInfo[] = [];
                let contextObjectName: string | undefined;
                let contextObjectProperties: { name: string; type: string }[] | undefined;

                if (isContextObjectPattern && parameters[0]) {
                    // Extract properties from context object
                    const contextParam = parameters[0];
                    contextObjectName = contextParam.name;
                    contextObjectProperties = this.astParser.extractObjectTypeProperties(functionNode, contextParam.name);

                    // Resolve dependencies from context object properties
                    dependencies = this.resolveDependenciesFromContextProperties(
                        contextObjectProperties || [],
                        allInterfaces,
                        allClassNames,
                        allFactoryNames,
                        importMappings
                    );
                } else {
                    // Resolve dependencies from individual parameters (existing behavior)
                    dependencies = this.resolveDependencies(parameters, allInterfaces, allClassNames, allFactoryNames, importMappings);
                }

                // Calculate import path
                const importPath = this.calculateImportPath(filePath);

                // Determine token:
                // - Instance factories use the interface name as the token (they are implementation providers)
                // - Regular factories use the function name as the token
                const token = instanceFactoryFor || functionName;

                factories.push({
                    name: functionName,
                    filePath,
                    dependencies,
                    parameters,
                    returnType,
                    importPath,
                    scope,
                    token,
                    useContextObject: isContextObjectPattern,
                    contextObjectName,
                    contextObjectProperties,
                    instanceFactoryFor,
                });
            }
        } catch (error) {
            Logger.warn(`Warning: Could not analyze factories in ${filePath}:`, { error });
        }

        return factories;
    }

    private hasFactoryAnnotation(root: any, functionNode: any): boolean {
        try {
            // Find all JSDoc comments in the file
            const comments = root.findAll({
                rule: {
                    kind: 'comment'
                }
            });

            const functionRange = functionNode.range();
            const functionStartLine = functionRange.start.line;

            // Find the JSDoc comment that appears immediately before this function
            for (const comment of comments) {
                const commentText = comment.text();
                if (commentText.includes('/**') && commentText.includes('@factory')) {
                    const commentRange = comment.range();
                    const commentEndLine = commentRange.end.line;

                    // Check if the comment comes before the function (within a few lines)
                    if (commentEndLine < functionStartLine &&
                        functionStartLine - commentEndLine <= 2) {
                        return true;
                    }
                }
            }

            return false;
        } catch {
            return false;
        }
    }
    private resolveDependencies(
        parameters: ConstructorParameter[],
        allInterfaces: Set<string>,
        allClassNames: Set<string>,
        allFactoryNames: Set<string>,
        importMappings: Map<string, string>
    ): DependencyInfo[] {
        const dependencies: DependencyInfo[] = [];

        for (const param of parameters) {
            const typeName = param.type;

            // Skip primitive types
            if (['string', 'number', 'boolean', 'Date', 'Object', 'Array'].includes(typeName)) {
                continue;
            }

            // Skip object types (they're handled separately)
            if (typeName.startsWith('{')) {
                continue;
            }

            // Determine if it's an interface, class, or factory
            const isInterface = allInterfaces.has(typeName);
            const isClass = allClassNames.has(typeName);
            const isFactory = allFactoryNames.has(typeName);

            if (isInterface || isClass || isFactory) {
                const importPath = importMappings.get(typeName) || './';
                dependencies.push({
                    name: typeName,
                    importPath,
                });
            }
        }

        return dependencies;
    }

    private resolveDependenciesFromContextProperties(
        properties: { name: string; type: string }[],
        allInterfaces: Set<string>,
        allClassNames: Set<string>,
        allFactoryNames: Set<string>,
        importMappings: Map<string, string>
    ): DependencyInfo[] {
        const dependencies: DependencyInfo[] = [];

        for (const prop of properties) {
            const typeName = prop.type;

            // Skip primitive types
            if (['string', 'number', 'boolean', 'Date', 'Object', 'Array'].includes(typeName)) {
                continue;
            }

            // Determine if it's an interface, class, or factory
            const isInterface = allInterfaces.has(typeName);
            const isClass = allClassNames.has(typeName);
            const isFactory = allFactoryNames.has(typeName);

            if (isInterface || isClass || isFactory) {
                const importPath = importMappings.get(typeName) || './';
                dependencies.push({
                    name: typeName,
                    importPath,
                });
            }
        }

        return dependencies;
    }

    private calculateImportPath(filePath: string): string {
        const relativePath = relative(this.sourceDir, filePath);
        // Convert to import path format (remove .ts extension, handle directory separators)
        return relativePath
            .replace(/\.ts$/, '')
            .replace(/\\/g, '/')
            .replace(/^\.\//, '');
    }

    /**
     * Extracts the core interface name from a return type annotation.
     * Handles: IFoo, Promise<IFoo>, Awaited<IFoo>, Awaited<Promise<IFoo>>
     * Returns the interface name if it matches a known interface, otherwise null.
     */
    private extractCoreInterfaceName(returnType: string, allInterfaces: Set<string>): string | undefined {
        const trimmed = returnType.trim();

        // Direct: IFoo
        if (allInterfaces.has(trimmed)) {
            return trimmed;
        }

        // Promise<IFoo>
        const promiseMatch = trimmed.match(/^Promise\s*<\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/);
        if (promiseMatch?.[1] && allInterfaces.has(promiseMatch[1])) {
            return promiseMatch[1];
        }

        // Awaited<IFoo> or Awaited<Promise<IFoo>>
        const awaitedMatch = trimmed.match(/^Awaited\s*<\s*(?:Promise\s*<\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*>?\s*>$/);
        if (awaitedMatch?.[1] && allInterfaces.has(awaitedMatch[1])) {
            return awaitedMatch[1];
        }

        return undefined;
    }
}

