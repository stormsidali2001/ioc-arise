import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join, relative, dirname } from 'path';
import { ClassInfo, AnalyzerOptions } from './types';
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
        
        const dependencies = this.extractConstructorDependencies(classNode);
        const importPath = this.generateImportPath(filePath, className);
        
        console.log(`Processing class: ${className}`);
        console.log(`Interface for ${className}:`, interfaceName);
        console.log(`Dependencies for ${className}:`, dependencies);
        
        classes.push({
          name: className,
          filePath,
          dependencies,
          interfaceName,
          importPath
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}:`, error);
    }

    return classes;
  }



  private extractConstructorDependencies(classNode: any): string[] {
    const dependencies: string[] = [];
    
    try {
      // Find constructor within the class using a simpler pattern
      const constructorNodes = classNode.findAll({
        rule:{

          kind:'method_definition',
          pattern:"$NAME",
          regex:"^constructor"

        }
      });
      console.log(constructorNodes.map((t:any,index:number)=>`\n (${index}) ------${t.text()}---------\n`).join(','))

      
      console.log(`Found ${constructorNodes.length} constructor nodes`);
      
      if (constructorNodes.length === 0) {
        return dependencies;
      }
      
      const constructorNode = constructorNodes[0];
      const constructorText = constructorNode.text();
      console.log('Constructor text:', constructorText);
      
      // Extract parameters using regex from the full constructor text
      const paramMatch = constructorText.match(/constructor\s*\(([^)]+)\)/);
      if (!paramMatch || !paramMatch[1]) {
        console.log('No parameters found in constructor');
        return dependencies;
      }
      
      const paramsText = paramMatch[1];
      console.log('Parameters text:', paramsText);
      // Split by comma and process each parameter
      const params = paramsText.split(',');
      
      for (const param of params) {
        const trimmedParam = param.trim();
        if (trimmedParam) {
          console.log('Processing parameter:', trimmedParam);
          // Match patterns like "private userRepo: UserRepository" or "userRepo: UserRepository"
          const typeMatch = trimmedParam.match(/(?:private|public|protected)?\s*\w+\s*:\s*(\w+)/);
          if (typeMatch && typeMatch[1]) {
            const typeName = typeMatch[1].trim();
            console.log('Found type:', typeName);
            if (typeName && /^[A-Z]\w*$/.test(typeName)) { // Only class-like types
              dependencies.push(typeName);
              console.log('Added dependency:', typeName);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Could not extract constructor dependencies:', error);
    }
    
    console.log('Final dependencies:', dependencies);
    return dependencies;
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