import { relative } from 'path';
import { ClassInfo, ConstructorParameter, InjectionScope } from '../types';
import { ASTParser } from './ast-parser';
import { container } from '../container';
import {logger} from "@notjustcoders/one-logger-client-sdk"

export class ClassAnalyzer {
  private astParser: ASTParser;
  private sourceDir: string;
  private interfacePattern?: string;

  constructor(sourceDir: string, interfacePattern?: string) {
    this.astParser =  container.astParser;
    this.sourceDir = sourceDir;
    this.interfacePattern = interfacePattern;
  }

  async analyzeFile(filePath: string): Promise<ClassInfo[]> {
    const classes: ClassInfo[] = [];

    try {
      const root = this.astParser.parseFile(filePath);
      
      // Extract import aliases for type resolution
      const typeAliases = this.astParser.extractTypeAliases(root);
      
      // Extract JSDoc scope annotations at file level for this specific file
      const jsDocScopes = this.astParser.extractJSDocComments(root);
      logger.log('JSDoc scopes for file', {filePath, jsDocScopes})
      
      // Find classes implementing interfaces
      const classNodesWithInterfaces = this.astParser.findClassesImplementingInterfaces(root);
      const processedClassNames = new Set<string>();

      for (const classNode of classNodesWithInterfaces) {
        const className = this.astParser.extractClassName(classNode);
        const interfaceName = this.astParser.extractInterfaceName(classNode);
        
        if (!className || !interfaceName) continue;
        
        // Filter by interface pattern if specified
        if (this.interfacePattern) {
          const pattern = new RegExp(this.interfacePattern);
          if (!pattern.test(interfaceName)) continue;
        }
        
        const constructorParams = this.astParser.extractConstructorParameters(classNode);
        const dependencies = this.resolveDependencies(constructorParams, typeAliases);
        const importPath = this.generateImportPath(filePath, className);
        const scope = this.astParser.extractScopeFromJSDoc(className, jsDocScopes);
        
        processedClassNames.add(className);

        logger.log(`Processing class with interface: ${className}`);
        logger.log(`Interface for ${className}:`, {interfaceName});
        logger.log(`Constructor params for ${className}:`, {constructorParams});
        logger.log(`Type aliases found:`, {count:Array.from(typeAliases.entries())});
        logger.log(`Dependencies for ${className}:`, {dependencies});
        logger.log(`Scope for ${className}:`, {scope});
        
        classes.push({
          name: className,
          filePath,
          dependencies,
          constructorParams,
          interfaceName,
          importPath,
          scope
        });
      }

      // Find all classes (including those without interfaces)
      const allClassNodes = this.astParser.findAllClasses(root);
      
      for (const classNode of allClassNodes) {
        const className = this.astParser.extractClassName(classNode);
        
        if (!className || processedClassNames.has(className)) continue;
        
        // Skip if this class implements an interface (already processed above)
        const classText = classNode.text();
        if (classText.includes('implements')) continue;
        
        const constructorParams = this.astParser.extractConstructorParameters(classNode);
        const dependencies = this.resolveDependencies(constructorParams, typeAliases);
        const importPath = this.generateImportPath(filePath, className);
        const scope = this.astParser.extractScopeFromJSDoc(className, jsDocScopes);
        
        logger.log(`Processing class without interface: ${className}`);
        logger.log(`Constructor params for ${className}:`, {constructorParams});
        logger.log(`Dependencies for ${className}:`, {dependencies});
        logger.log(`Scope for ${className}:`, {scope});
        
        classes.push({
          name: className,
          filePath,
          dependencies,
          constructorParams,
          interfaceName: undefined, // No interface for these classes
          importPath,
          scope
        });
      }
    } catch (error) {
      logger.warn(`Warning: Could not parse ${filePath}:`, {error});
    }

    return classes;
  }

  private resolveDependencies(constructorParams: ConstructorParameter[], typeAliases: Map<string, string>): string[] {
    return constructorParams
      .map(param => {
        // Resolve type aliases to actual interface names
        const resolvedType = typeAliases.get(param.type) || param.type;
        return resolvedType;
      })
      .filter(type => /^[A-Z]\w*$/.test(type));
  }

  private generateImportPath(filePath: string, className: string): string {
    // Generate relative import path from the output directory
    const relativePath = relative(this.sourceDir, filePath);
    const pathWithoutExtension = relativePath.replace(/\.ts$/, '');
    return `./${pathWithoutExtension}`;
  }
}