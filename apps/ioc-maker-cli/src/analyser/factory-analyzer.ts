import { relative } from 'path';
import { FactoryInfo, ConstructorParameter, InjectionScope, DependencyInfo } from '../types';
import { ASTParser } from './ast-parser';
import { container } from '../container';
import { DependencyResolver } from './dependency-resolver';
import { Logger } from '../utils/logger';

export class FactoryAnalyzer {
    private astParser: ASTParser;
    private sourceDir: string;

    constructor(sourceDir: string) {
        this.astParser = container.astParser;
        this.sourceDir = sourceDir;
    }

    async analyzeFiles(filePaths: string[]): Promise<FactoryInfo[]> {
        const allFactories: FactoryInfo[] = [];
        const allInterfaces = new Set<string>();
        const allClassNames = new Set<string>();
        const fileASTMap = new Map<string, any>();

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
            } catch (error) {
                Logger.warn(`Warning: Could not parse ${filePath}:`, { error });
            }
        }

        // Second pass: Analyze factory functions
        for (const filePath of filePaths) {
            const root = fileASTMap.get(filePath);
            if (root) {
                const factories = await this.analyzeFileFromAST(filePath, root, allInterfaces, allClassNames);
                allFactories.push(...factories);
            }
        }

        return allFactories;
    }

    private async analyzeFileFromAST(
        filePath: string,
        root: any,
        allInterfaces: Set<string>,
        allClassNames: Set<string>
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

                // Only analyze exported functions that look like factories
                // Factory functions typically start with "create" or are explicitly marked
                const isExported = this.astParser.isExportedFunction(functionNode);
                const isFactoryLike = functionName.toLowerCase().startsWith('create') ||
                    functionName.toLowerCase().startsWith('make') ||
                    functionName.toLowerCase().startsWith('build');

                Logger.debug(`Function ${functionName}: isExported=${isExported}, isFactoryLike=${isFactoryLike}`);
                if (!isExported || (!isFactoryLike && !this.hasFactoryAnnotation(functionNode))) {
                    Logger.debug(`Skipping function ${functionName}`);
                    continue;
                }

                const parameters = this.astParser.extractFunctionParameters(functionNode);
                const returnType = this.astParser.extractFunctionReturnType(functionNode);
                // Try to get scope from JSDoc, default to singleton
                const scope = jsDocScopes.get(functionName) || 'singleton';

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
                        importMappings
                    );
                } else {
                    // Resolve dependencies from individual parameters (existing behavior)
                    dependencies = this.resolveDependencies(parameters, allInterfaces, allClassNames, importMappings);
                }

                // Calculate import path
                const importPath = this.calculateImportPath(filePath);

                // Determine token - use the function name directly
                const token = functionName;

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
                });
            }
        } catch (error) {
            Logger.warn(`Warning: Could not analyze factories in ${filePath}:`, { error });
        }

        return factories;
    }

    private hasFactoryAnnotation(functionNode: any): boolean {
        try {
            const functionText = functionNode.text();
            // Check for @factory annotation in JSDoc
            return functionText.includes('@factory') || functionText.includes('@ioc-factory');
        } catch {
            return false;
        }
    }

    private resolveDependencies(
        parameters: ConstructorParameter[],
        allInterfaces: Set<string>,
        allClassNames: Set<string>,
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

            // Determine if it's an interface or class
            const isInterface = allInterfaces.has(typeName);
            const isClass = allClassNames.has(typeName);

            if (isInterface || isClass) {
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
        importMappings: Map<string, string>
    ): DependencyInfo[] {
        const dependencies: DependencyInfo[] = [];

        for (const prop of properties) {
            const typeName = prop.type;

            // Skip primitive types
            if (['string', 'number', 'boolean', 'Date', 'Object', 'Array'].includes(typeName)) {
                continue;
            }

            // Determine if it's an interface or class
            const isInterface = allInterfaces.has(typeName);
            const isClass = allClassNames.has(typeName);

            if (isInterface || isClass) {
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
}

