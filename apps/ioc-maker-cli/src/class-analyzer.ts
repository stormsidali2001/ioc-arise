import { relative } from 'path';
import { ClassInfo, ConstructorParameter, InjectionScope } from './types';
import { ASTParser } from './ast-parser';

export class ClassAnalyzer {
  private astParser: ASTParser;
  private sourceDir: string;
  private interfacePattern?: string;

  constructor(sourceDir: string, interfacePattern?: string) {
    this.astParser = new ASTParser();
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
      console.log('JSDoc scopes for file', filePath, ':', jsDocScopes)
      
      // Find classes implementing interfaces
      const classNodes = this.astParser.findClassesImplementingInterfaces(root);

      for (const classNode of classNodes) {
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
        
        console.log(`Processing class: ${className}`);
        console.log(`Interface for ${className}:`, interfaceName);
        console.log(`Constructor params for ${className}:`, constructorParams);
        console.log(`Type aliases found:`, Array.from(typeAliases.entries()));
        console.log(`Dependencies for ${className}:`, dependencies);
        console.log(`Scope for ${className}:`, scope);
        
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
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}:`, error);
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