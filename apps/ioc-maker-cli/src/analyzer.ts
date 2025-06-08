import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join, relative, dirname } from 'path';
import { ClassInfo, AnalyzerOptions, ConstructorParameter } from './types';
import { ts } from '@ast-grep/napi';

export class ProjectAnalyzer {
  private options: AnalyzerOptions;

  constructor(options: AnalyzerOptions) {
    this.options = options;
  }

  async analyzeProject(): Promise<ClassInfo[]> {
    const tsFiles = await this.findTypeScriptFiles();
    const classes: ClassInfo[] = [];

    for (const filePath of tsFiles) {
      const fileClasses = await this.analyzeFile(filePath);
      classes.push(...fileClasses);
    }

    return classes;
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const pattern = join(this.options.sourceDir, '**/*.ts');
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        ...(this.options.excludePatterns || [])
      ]
    });
    return files;
  }

  private async analyzeFile(filePath: string): Promise<ClassInfo[]> {
    const content = readFileSync(filePath, 'utf-8');
    const classes: ClassInfo[] = [];

    try {
      // Parse the file content using ast-grep
      const ast = ts.parse(content);
      const root = ast.root();
      
      // Extract import aliases for type resolution
      const typeAliases = this.extractTypeAliases(root);
      
      // Find classes implementing interfaces
      const classNodes = root.findAll({
        rule: {
          pattern: 'class $CLASS implements $INTERFACE { $$$ }'
        }
      });

      for (const classNode of classNodes) {
        const className = classNode.getMatch('CLASS')?.text();
        const interfaceName = classNode.getMatch('INTERFACE')?.text();
        
        if (!className || !interfaceName) continue;
        
        // Filter by interface pattern if specified
        if (this.options.interfacePattern) {
          const pattern = new RegExp(this.options.interfacePattern);
          if (!pattern.test(interfaceName)) continue;
        }
        
        const constructorParams = this.extractConstructorParameters(classNode);
        const dependencies = constructorParams
          .map(param => {
            // Resolve type aliases to actual interface names
            const resolvedType = typeAliases.get(param.type) || param.type;
            return resolvedType;
          })
          .filter(type => /^[A-Z]\w*$/.test(type));
        const importPath = this.generateImportPath(filePath, className);
        
        console.log(`Processing class: ${className}`);
        console.log(`Interface for ${className}:`, interfaceName);
        console.log(`Constructor params for ${className}:`, constructorParams);
        console.log(`Type aliases found:`, Array.from(typeAliases.entries()));
        console.log(`Dependencies for ${className}:`, dependencies);
        
        classes.push({
          name: className,
          filePath,
          dependencies,
          constructorParams,
          interfaceName,
          importPath
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}:`, error);
    }

    return classes;
  }



  private extractConstructorParameters(classNode: any): ConstructorParameter[] {
    const parameters: ConstructorParameter[] = [];
    
    try {
      // Find constructor within the class
      const constructorNodes = classNode.findAll({
        rule: {
          kind: 'method_definition',
          pattern: "$NAME",
          regex: "^constructor"
        }
      });
      
      console.log(`Found ${constructorNodes.length} constructor nodes`);
      
      if (constructorNodes.length === 0) {
        return parameters;
      }
      
      const constructorNode = constructorNodes[0];
      
      // Find formal parameters within the constructor
      const parameterNodes = constructorNode.findAll({
        rule: {
          kind: 'formal_parameters'
        }
      });
      
      if (parameterNodes.length === 0) {
        return parameters;
      }
      
      const formalParams = parameterNodes[0];
      
      // Find individual parameters
      const paramNodes = formalParams.findAll({
        rule: {
          kind: 'required_parameter'
        }
      });
      
      console.log(`Found ${paramNodes.length} parameter nodes`);
      
      for (const paramNode of paramNodes) {
        const paramText = paramNode.text();
        console.log('Parameter text:', paramText);
        
        // Parse parameter using regex to extract details
        const paramMatch = paramText.match(/(?:(private|public|protected)\s+)?(\w+)\s*:\s*(\w+)(\?)?/);
        
        if (paramMatch) {
          const [, accessModifier, name, type, optional] = paramMatch;
          
          parameters.push({
            name: name.trim(),
            type: type.trim(),
            isOptional: !!optional,
            accessModifier: accessModifier as 'private' | 'public' | 'protected' | undefined
          });
          
          console.log(`Extracted parameter: ${name}: ${type}${optional ? '?' : ''} (${accessModifier || 'none'})`);
        }
      }
    } catch (error) {
      console.warn('Warning: Could not extract constructor parameters:', error);
    }
    
    console.log('Final parameters:', parameters);
    return parameters;
  }

  private extractTypeAliases(root: any): Map<string, string> {
    const typeAliases = new Map<string, string>();
    
    try {
      // Find all import statements and parse them manually
      const allImports = root.findAll({
        rule: {
          kind: 'import_statement'
        }
      });
      
      console.log(`Found ${allImports.length} total import statements`);
      
      for (const importNode of allImports) {
        const importText = importNode.text();
        console.log(`Import statement: ${importText}`);
        
        // Manual regex parsing - handles variable whitespace
        const aliasMatch = importText.match(/import\s*{\s*([\w]+)\s+as\s+([\w]+)\s*}\s+from/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          typeAliases.set(alias.trim(), original.trim());
          console.log(`Manual regex found type alias: ${alias.trim()} -> ${original.trim()}`);
        }
      }
    } catch (error) {
      console.warn('Warning: Could not extract type aliases:', error);
    }
    
    return typeAliases;
  }

  private generateImportPath(filePath: string, className: string): string {
    // Generate relative import path from the output directory
    const relativePath = relative(this.options.sourceDir, filePath);
    const pathWithoutExtension = relativePath.replace(/\.ts$/, '');
    return `./${pathWithoutExtension}`;
  }
}

export async function analyzeProject(sourceDir: string, options?: Partial<AnalyzerOptions>): Promise<ClassInfo[]> {
  const analyzer = new ProjectAnalyzer({
    sourceDir,
    ...options
  });
  
  return analyzer.analyzeProject();
}