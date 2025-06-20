import { relative } from 'path';
import { ClassInfo, ConstructorParameter, InjectionScope, DependencyInfo } from '../types';
import { ASTParser } from './ast-parser';
import { container } from '../container';
import {logger} from "@notjustcoders/one-logger-client-sdk"
import { ErrorFactory, IoCErrorCode } from '../errors/index.js';

export class ClassAnalyzer {
  private astParser: ASTParser;
  private sourceDir: string;
  private interfacePattern?: string;

  constructor(sourceDir: string, interfacePattern?: string) {
    this.astParser =  container.astParser;
    this.sourceDir = sourceDir;
    this.interfacePattern = interfacePattern;
  }

  async analyzeFiles(filePaths: string[]): Promise<ClassInfo[]> {
    const allClasses: ClassInfo[] = [];
    const allInterfaces = new Set<string>();
    const allClassNames = new Set<string>();
    const allAbstractClasses = new Set<string>();
    const fileASTMap = new Map<string, any>();

    // First pass: Parse all files and collect interface, class names, and abstract classes
    for (const filePath of filePaths) {
      try {
        const root = this.astParser.parseFile(filePath);
        fileASTMap.set(filePath, root);
        
        // Collect interfaces
        const interfaces = this.astParser.extractInterfaces(root);
        interfaces.forEach(interfaceName => allInterfaces.add(interfaceName));
        
        // Collect class names and abstract classes
        const classNodes = this.astParser.findAllClasses(root);
        console.log(`DEBUG: Found ${classNodes.length} class nodes in ${filePath}`);
        for (const classNode of classNodes) {

          const className = this.astParser.extractClassName(classNode);
          if (className) {
            allClassNames.add(className);
            const isAbstract = this.astParser.isAbstractClass(classNode);
            console.log(`DEBUG: Class ${className} - isAbstract: ${isAbstract}`);
            console.log(`DEBUG: Class node text:`, classNode.text().substring(0, 100));
            if (isAbstract) {
              allAbstractClasses.add(className);
            }
          }
        }
      } catch (error) {
        logger.warn(`Warning: Could not parse ${filePath}:`, {error});
      }
    }

    // Second pass: Analyze each file using the cached ASTs and collected types
    for (const filePath of filePaths) {
      const root = fileASTMap.get(filePath);
      if (root) {
        const classes = await this.analyzeFileFromAST(filePath, root, allInterfaces, allClassNames, allAbstractClasses);
        allClasses.push(...classes);
      }
    }

    // Filter out classes that have zero dependencies and are not referenced by others
    const filteredClasses = this.filterUnusedClasses(allClasses);
    
    return filteredClasses;
  }

  async analyzeFile(filePath: string, allInterfaces: Set<string>, allClassNames: Set<string>, allAbstractClasses: Set<string>): Promise<ClassInfo[]> {
    try {
      const root = this.astParser.parseFile(filePath);
      return await this.analyzeFileFromAST(filePath, root, allInterfaces, allClassNames, allAbstractClasses);
    } catch (error) {
      logger.warn(`Warning: Could not parse ${filePath}:`, {error});

      return [];
    }
  }

  private async analyzeFileFromAST(filePath: string, root: any, allInterfaces: Set<string>, allClassNames: Set<string>, allAbstractClasses: Set<string>): Promise<ClassInfo[]> {
    const classes: ClassInfo[] = [];

    try {
      // Extract import aliases for type resolution
      const typeAliases = this.astParser.extractTypeAliases(root);
      
      // Extract import mappings for dependency paths
      const importMappings = this.astParser.extractImportMappings(root);
      
      // Extract JSDoc scope annotations at file level for this specific file
      const jsDocScopes = this.astParser.extractJSDocComments(root);
      logger.log('JSDoc scopes for file', {filePath, jsDocScopes})
      
      // Find all classes once and process them efficiently
      const allClassNodes = this.astParser.findAllClasses(root);
      const classNodesWithInterfaces = this.astParser.findClassesImplementingInterfaces(root);
      const classNodesExtendingClasses = this.astParser.findClassesExtendingClasses(root);
      const processedClassNames = new Set<string>();

      // Process classes with interfaces first
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
        const dependencies = this.resolveDependencies(constructorParams, typeAliases, importMappings, allInterfaces, allClassNames);
        const importPath = this.generateImportPath(filePath, className);
        const scope = this.astParser.extractScopeFromJSDoc(className, jsDocScopes);
        const isAbstract = this.astParser.isAbstractClass(classNode);
        
        processedClassNames.add(className);

        logger.log(`Processing class with interface: ${className}`);
        logger.log(`Interface for ${className}:`, {interfaceName});
        logger.log(`Constructor params for ${className}:`, {constructorParams});
        logger.log(`Type aliases found:`, {count:Array.from(typeAliases.entries())});
        logger.log(`Dependencies for ${className}:`, {dependencies});
        logger.log(`Scope for ${className}:`, {scope});
        logger.log(`Is abstract: ${isAbstract}`);
        
        // Skip abstract classes - they cannot be instantiated
        if (isAbstract) {
          logger.log(`Skipping abstract class: ${className} (abstract classes cannot be instantiated)`);
          continue;
        }
        
        classes.push({
          name: className,
          filePath,
          dependencies,
          constructorParams,
          interfaceName,
          abstractClassName: undefined, // No abstract class for interface implementations
          importPath,
          scope
        });
      }

      // Process classes extending other classes
      for (const classNode of classNodesExtendingClasses) {
        const className = this.astParser.extractClassName(classNode);
        const parentClassName = this.astParser.extractParentClassName(classNode);
        
        if (!className || !parentClassName || processedClassNames.has(className)) continue;
        
        // Check if the parent class is abstract using the global abstract classes set
        const isParentAbstract = allAbstractClasses.has(parentClassName);
        
        console.log(`DEBUG: Class ${className} extends ${parentClassName}. Is parent abstract? ${isParentAbstract}`);
        console.log(`DEBUG: All abstract classes:`, Array.from(allAbstractClasses));
        
        // Only process if parent is abstract
        if (isParentAbstract) {
          const constructorParams = this.astParser.extractConstructorParameters(classNode);
          const dependencies = this.resolveDependencies(constructorParams, typeAliases, importMappings, allInterfaces, allClassNames);
          const importPath = this.generateImportPath(filePath, className);
          const scope = this.astParser.extractScopeFromJSDoc(className, jsDocScopes);
          const isAbstract = this.astParser.isAbstractClass(classNode);
          
          processedClassNames.add(className);

          logger.log(`Processing class extending ${isParentAbstract ? 'abstract ' : ''}class: ${className} extends ${parentClassName}`);
          logger.log(`Constructor params for ${className}:`, {constructorParams});
          logger.log(`Dependencies for ${className}:`, {dependencies});
          logger.log(`Scope for ${className}:`, {scope});
          logger.log(`Is abstract: ${isAbstract}`);
          
          // Skip abstract classes - they cannot be instantiated
          if (isAbstract) {
            logger.log(`Skipping abstract class: ${className} (abstract classes cannot be instantiated)`);
            continue;
          }
          
          classes.push({
            name: className,
            filePath,
            dependencies,
            constructorParams,
            interfaceName: undefined, // No interface for classes extending abstract classes
            abstractClassName: parentClassName, // Track which abstract class this extends
            importPath,
            scope
          });
          
          logger.log(`Added class ${className} extending abstract class: ${parentClassName}`);
        }
      }

      // Process remaining classes without interfaces or inheritance
      for (const classNode of allClassNodes) {
        const className = this.astParser.extractClassName(classNode);
        
        if (!className || processedClassNames.has(className)) continue;
        
        // Skip if this class implements an interface or extends another class (already processed above)
        const classText = classNode.text();
        if (classText.includes('implements') || classText.includes('extends')) continue;
        
        const constructorParams = this.astParser.extractConstructorParameters(classNode);
        const dependencies = this.resolveDependencies(constructorParams, typeAliases, importMappings, allInterfaces, allClassNames);
        const importPath = this.generateImportPath(filePath, className);
        const scope = this.astParser.extractScopeFromJSDoc(className, jsDocScopes);
        const isAbstract = this.astParser.isAbstractClass(classNode);
        
        logger.log(`Processing class without interface: ${className}`);
        logger.log(`Constructor params for ${className}:`, {constructorParams});
        logger.log(`Dependencies for ${className}:`, {dependencies});
        logger.log(`Scope for ${className}:`, {scope});
        logger.log(`Is abstract: ${isAbstract}`);
        
        // Skip abstract classes - they cannot be instantiated
        if (isAbstract) {
          logger.log(`Skipping abstract class: ${className} (abstract classes cannot be instantiated)`);
          continue;
        }
        
        classes.push({
          name: className,
          filePath,
          dependencies,
          constructorParams,
          interfaceName: undefined, // No interface for these classes
          abstractClassName: undefined, // No abstract class for standalone classes
          importPath,
          scope
        });
      }
    } catch (error) {
      throw ErrorFactory.wrapError(
        error as Error,
        IoCErrorCode.ANALYSIS_FAILED,
        { filePath }
      );
    }

    return classes;
  }

  private resolveDependencies(
    constructorParams: ConstructorParameter[], 
    typeAliases: Map<string, string>, 
    importMappings: Map<string, string>,
    allInterfaces: Set<string>, 
    allClassNames: Set<string>
  ): DependencyInfo[] {

    const result = constructorParams
      .map(param => {
        // Resolve type aliases to actual interface names
        const resolvedType = typeAliases.get(param.type) || param.type;
        return {
          originalType: param.type,
          resolvedType: resolvedType
        };
      })
      .filter(typeInfo => {
        
        console.log("all interfaces",allInterfaces)
        console.log("all classes",allClassNames)
        
        const isValidInterface = allInterfaces.has(typeInfo.resolvedType);
        const isValidClass = allClassNames.has(typeInfo.resolvedType);

        return isValidClass || isValidInterface;
      })
      .map(typeInfo => {
        // Get import path from import mappings, fallback to resolvedType if not found
        const importPath = importMappings.get(typeInfo.originalType) || 
                          importMappings.get(typeInfo.resolvedType) || 
                          `./${typeInfo.resolvedType}`; // fallback for local types
        
        return {
          name: typeInfo.resolvedType,
          importPath: importPath
        };
      });
      return result;

  }

  private filterUnusedClasses(classes: ClassInfo[]): ClassInfo[] {
    console.log('DEBUG: filterUnusedClasses called with classes:', classes.map(c => ({
      name: c.name,
      dependencies: c.dependencies,
      interfaceName: c.interfaceName
    })));
    
    // Create a set of all dependencies (class names and interface names referenced by others)
    const referencedTypes = new Set<string>();
    
    classes.forEach(classInfo => {
      classInfo.dependencies.forEach(dep => {
        referencedTypes.add(dep.name);
      });
    });
    
    console.log('DEBUG: referencedTypes:', Array.from(referencedTypes));
    
    // Filter out classes that:
    // 1. Have zero dependencies AND are not referenced by any other class
    // Note: Controllers and other entry points should be kept even if not referenced
    // Note: Abstract classes are already excluded during collection phase
    const filteredClasses = classes.filter(classInfo => {
      const isClassReferenced = referencedTypes.has(classInfo.name);
      const isInterfaceReferenced = classInfo.interfaceName ? referencedTypes.has(classInfo.interfaceName) : false;
      
      // Keep the class if:
      // - It has dependencies (including controllers that inject services), OR
      // - It is referenced by others (either by class name or interface name)
      const shouldKeep = classInfo.dependencies.length > 0 || isClassReferenced || isInterfaceReferenced;
      
      console.log(`DEBUG: Class ${classInfo.name} - shouldKeep: ${shouldKeep}, deps: ${classInfo.dependencies.length}, referenced: ${isClassReferenced}, interfaceReferenced: ${isInterfaceReferenced}`);
      
      if (!shouldKeep) {
        logger.log(`Filtering out unused class: ${classInfo.name} (no dependencies and not referenced by others)`);
      }
      
      return shouldKeep;
    });
    
    logger.log(`Filtered classes: ${classes.length} -> ${filteredClasses.length}`);
    
    return filteredClasses;
  }

  private generateImportPath(filePath: string, className: string): string {
    // Generate relative import path from the output directory
    const relativePath = relative(this.sourceDir, filePath);
    const pathWithoutExtension = relativePath.replace(/\.ts$/, '');
    return `./${pathWithoutExtension}`;
  }
}