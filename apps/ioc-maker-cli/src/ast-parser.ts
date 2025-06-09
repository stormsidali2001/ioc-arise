import { readFileSync } from 'fs';
import { ts } from '@ast-grep/napi';
import { ConstructorParameter, InjectionScope } from './types';

export class ASTParser {
  parseFile(filePath: string): any {
    const content = readFileSync(filePath, 'utf-8');
    const ast = ts.parse(content);
    return ast.root();
  }

  findClassesImplementingInterfaces(root: any): any[] {
    return root.findAll({
      rule: {
        pattern: 'class $CLASS implements $INTERFACE { $$$ }'
      }
    });
  }

  extractClassName(classNode: any): string | undefined {
    console.log('Extracting class name from node:', classNode.text().substring(0, 100) + '...');
    
    // Try different approaches to extract class name
    let className = classNode.getMatch('CLASS')?.text();
    if (className) {
      console.log('Found class name using CLASS match:', className);
      return className;
    }
    
    // Try to match the class declaration pattern directly
    const classText = classNode.text();
    const classMatch = classText.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (classMatch) {
      className = classMatch[1];
      console.log('Found class name using regex:', className);
      return className;
    }
    
    console.log('Failed to extract class name');
    return undefined;
  }

  extractInterfaceName(classNode: any): string | undefined {
    return classNode.getMatch('INTERFACE')?.text();
  }

  extractConstructorParameters(classNode: any): ConstructorParameter[] {
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

  extractJSDocComments(root: any): Map<string, InjectionScope> {
    const classScopes = new Map<string, InjectionScope>();
    
    try {
      // Find all JSDoc comments in the file
      const comments = root.findAll({
        rule: {
          kind: 'comment'
        }
      });
      
      console.log(`Found ${comments.length} comments in file`);
      
      // Find all class declarations
      const classDeclarations = root.findAll({
        rule: {
          kind: 'class_declaration'
        }
      });
      
      console.log(`Found ${classDeclarations.length} class declarations in file`);
      
      for (const comment of comments) {
        const commentText = comment.text();
        console.log(`Comment text: ${commentText}`);
        
        if (commentText.includes('/**') && commentText.includes('@scope')) {
          console.log(`Found @scope comment: ${commentText}`);
          const scopeMatch = commentText.match(/@scope\s+(singleton|transient)/);
          if (scopeMatch) {
            const scope = scopeMatch[1] as InjectionScope;
            const commentRange = comment.range();
            console.log(`Comment range: line ${commentRange.start.line} to ${commentRange.end.line}`);
            
            // Find the class declaration that comes immediately after this comment
            for (const classDecl of classDeclarations) {
              const classRange = classDecl.range();
              console.log(`Class range: line ${classRange.start.line} to ${classRange.end.line}`);
              
              // Check if the class comes after the comment
              if (classRange.start.line > commentRange.end.line) {
                const className = this.extractClassName(classDecl);
                console.log(`Attempting to extract class name from class at line ${classRange.start.line}`);
                console.log(`Extracted class name: ${className}`);
                if (className) {
                  console.log(`Found JSDoc scope annotation: ${className} -> ${scope}`);
                  classScopes.set(className, scope);
                  break; // Take the first class after this comment
                } else {
                  console.log(`Failed to extract class name from class declaration`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Could not extract JSDoc comments:', error);
    }
    
    console.log(`Final classScopes map:`, classScopes);
    return classScopes;
  }

  extractScopeFromJSDoc(className: string, jsDocScopes: Map<string, InjectionScope>): InjectionScope {
    return jsDocScopes.get(className) || 'singleton';
  }

  extractTypeAliases(root: any): Map<string, string> {
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
}