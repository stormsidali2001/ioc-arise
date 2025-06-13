import { readFileSync } from 'fs';
import { ts } from '@ast-grep/napi';
import { ConstructorParameter, InjectionScope } from '../types';
import { logger} from "@notjustcoders/one-logger-client-sdk"


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

  findAllClasses(root: any): any[] {
    return root.findAll({
      rule: {
        kind: 'class_declaration'
      }
    });
  }

  extractClassName(classNode: any): string | undefined {
    logger.log('Extracting class name from node:', {result: classNode.text().substring(0, 100) + '...'});
    
    // Try different approaches to extract class name
    let className = classNode.getMatch('CLASS')?.text();
    if (className) {
      logger.log('Found class name using CLASS match:', className);
      return className;
    }
    
    // Try to match the class declaration pattern directly
    const classText = classNode.text();
    const classMatch = classText.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (classMatch) {
      className = classMatch[1];
      logger.log('Found class name using regex:', className);
      return className;
    }
    
    logger.log('Failed to extract class name');
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
      
      logger.log(`Found ${constructorNodes.length} constructor nodes`);
      
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
      
      // Find individual parameters (both required and optional)
      const requiredParamNodes = formalParams.findAll({
        rule: {
          kind: 'required_parameter'
        }
      });
      
      const optionalParamNodes = formalParams.findAll({
        rule: {
          kind: 'optional_parameter'
        }
      });
      
      const paramNodes = [...requiredParamNodes, ...optionalParamNodes];
      
      logger.log(`Found ${paramNodes.length} parameter nodes`);
      
      for (const paramNode of paramNodes) {
        const paramText = paramNode.text();
        logger.log('Parameter text:', paramText);
        
        // Parse parameter using regex to extract details
        const paramMatch = paramText.match(/(?:(private|public|protected)\s+)?(\w+)(\?)?\s*:\s*(\w+)/);
        
        if (paramMatch) {
          const [, accessModifier, name, optional, type] = paramMatch;
          
          parameters.push({
            name: name.trim(),
            type: type.trim(),
            isOptional: !!optional,
            accessModifier: accessModifier as 'private' | 'public' | 'protected' | undefined
          });
          
          logger.log(`Extracted parameter: ${name}: ${type}${optional ? '?' : ''} (${accessModifier || 'none'})`);
        }
      }
    } catch (error) {
      logger.warn('Warning: Could not extract constructor parameters:', {error});
    }
    
    logger.log('Final parameters:', {parameters});
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
      
      logger.log(`Found ${comments.length} comments in file`);
      
      // Find all class declarations
      const classDeclarations = root.findAll({
        rule: {
          kind: 'class_declaration'
        }
      });
      
      logger.log(`Found ${classDeclarations.length} class declarations in file`);
      
      for (const comment of comments) {
        const commentText = comment.text();
        logger.log(`Comment text: ${commentText}`);
        
        if (commentText.includes('/**') && commentText.includes('@scope')) {
          logger.log(`Found @scope comment: ${commentText}`);
          const scopeMatch = commentText.match(/@scope\s+(singleton|transient)/);
          if (scopeMatch) {
            const scope = scopeMatch[1] as InjectionScope;
            const commentRange = comment.range();
            logger.log(`Comment range: line ${commentRange.start.line} to ${commentRange.end.line}`);
            
            // Find the class declaration that comes immediately after this comment
            for (const classDecl of classDeclarations) {
              const classRange = classDecl.range();
              logger.log(`Class range: line ${classRange.start.line} to ${classRange.end.line}`);
              
              // Check if the class comes after the comment
              if (classRange.start.line > commentRange.end.line) {
                const className = this.extractClassName(classDecl);
                logger.log(`Attempting to extract class name from class at line ${classRange.start.line}`);
                logger.log(`Extracted class name: ${className}`);
                if (className) {
                  logger.log(`Found JSDoc scope annotation: ${className} -> ${scope}`);
                  classScopes.set(className, scope);
                  break; // Take the first class after this comment
                } else {
                  logger.log(`Failed to extract class name from class declaration`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Warning: Could not extract JSDoc comments:', {error});
    }
    
    logger.log(`Final classScopes map:`, {classScopes});
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
      
      logger.log(`Found ${allImports.length} total import statements`);
      
      for (const importNode of allImports) {
        const importText = importNode.text();
        logger.log(`Import statement: ${importText}`);
        
        // Manual regex parsing - handles variable whitespace
        const aliasMatch = importText.match(/import\s*{\s*([\w]+)\s+as\s+([\w]+)\s*}\s+from/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          typeAliases.set(alias.trim(), original.trim());
          logger.log(`Manual regex found type alias: ${alias.trim()} -> ${original.trim()}`);
        }
      }
    } catch (error) {
      logger.warn('Warning: Could not extract type aliases:', {error});
    }
    
    return typeAliases;
  }

  extractImportMappings(root: any): Map<string, string> {
    const importMappings = new Map<string, string>();
    
    try {
      // Find all import statements
      const allImports = root.findAll({
        rule: {
          kind: 'import_statement'
        }
      });
      
      logger.log(`Found ${allImports.length} import statements for mapping`);
      
      for (const importNode of allImports) {
        const importText = importNode.text();
        logger.log(`Processing import: ${importText}`);
        
        // Extract import path
        const pathMatch = importText.match(/from\s+['"]([^'"]+)['"]/);
        if (!pathMatch) continue;
        
        const importPath = pathMatch[1];
        
        // Handle different import patterns
        // Named imports: import { A, B } from './path'
        const namedImportsMatch = importText.match(/import\s*{\s*([^}]+)\s*}\s*from/);
        if (namedImportsMatch) {
          const namedImports = namedImportsMatch[1].split(',');
          for (const namedImport of namedImports) {
            const trimmed = namedImport.trim();
            // Handle aliases: A as B
            const aliasMatch = trimmed.match(/([\w]+)\s+as\s+([\w]+)/);
            if (aliasMatch) {
              const [, original, alias] = aliasMatch;
              importMappings.set(alias.trim(), importPath);
              logger.log(`Mapped alias ${alias.trim()} -> ${importPath}`);
            } else {
              importMappings.set(trimmed, importPath);
              logger.log(`Mapped named import ${trimmed} -> ${importPath}`);
            }
          }
        }
        
        // Default imports: import A from './path'
        const defaultImportMatch = importText.match(/import\s+([\w]+)\s+from/);
        if (defaultImportMatch && !namedImportsMatch) {
          const defaultImport = defaultImportMatch[1];
          importMappings.set(defaultImport, importPath);
          logger.log(`Mapped default import ${defaultImport} -> ${importPath}`);
        }
      }
    } catch (error) {
      logger.warn('Warning: Could not extract import mappings:', {error});
    }
    
    logger.log(`Final import mappings:`, {importMappings});
    return importMappings;
  }

  extractInterfaces(root: any): string[] {
    const interfaces: string[] = [];
    
    try {
      // Find all interface declarations
      const interfaceNodes = root.findAll({
        rule: {
          kind: 'interface_declaration'
        }
      });
      
      logger.log(`Found ${interfaceNodes.length} interface declarations`);
      
      for (const interfaceNode of interfaceNodes) {
        const interfaceText = interfaceNode.text();
        logger.log(`Interface text: ${interfaceText}`);
        
        // Extract interface name using regex
        const interfaceMatch = interfaceText.match(/interface\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (interfaceMatch) {
          const interfaceName = interfaceMatch[1];
          
          // Check if interface has at least one method
          const methodNodes = interfaceNode.findAll({
            rule: {
              kind: 'method_signature'
            }
          });
          
          
          // Consider interface valid if it has at least one method 
          if (methodNodes.length > 0 ) {
            interfaces.push(interfaceName);
            logger.log(`Found valid interface: ${interfaceName} with ${methodNodes.length} methods `);
          } else {
            logger.log(`Skipping empty interface: ${interfaceName}`);
          }
        }
      }
    } catch (error) {
      logger.warn('Warning: Could not extract interfaces:', {error});
    }
    
    logger.log(`Final interfaces:`, {interfaces});
    return interfaces;
  }
}