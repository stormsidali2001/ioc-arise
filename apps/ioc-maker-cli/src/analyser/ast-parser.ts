import { readFileSync } from 'fs';
import { ts } from '@ast-grep/napi';
import { ConstructorParameter, InjectionScope } from '../types';
import { ErrorFactory } from '../errors/errorFactory';
import { Logger } from '../utils/logger';



export class ASTParser {
  parseFile(filePath: string): any {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const ast = ts.parse(content);
      return ast.root();
    } catch (error) {
      throw ErrorFactory.fileReadError(
        filePath,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  findClassesImplementingInterfaces(root: any): any[] {
    return root.findAll({
      rule: {
        pattern: 'class $CLASS implements $INTERFACE { $$$ }'
      }
    });
  }

  findClassesExtendingClasses(root: any): any[] {
    return root.findAll({
      rule: {
        pattern: 'class $CLASS extends $PARENT { $$$ }'
      }
    });
  }

  findAllClasses(root: any): any[] {
    // Find regular class declarations
    const regularClasses = root.findAll({
      rule: {
        kind: 'class_declaration'
      }
    });

    // Find abstract class declarations using pattern matching
    const abstractClasses = root.findAll({
      rule: {
        pattern: 'abstract class $NAME { $$$ }'
      }
    });

    // Also try to find exported abstract classes
    const exportedAbstractClasses = root.findAll({
      rule: {
        pattern: 'export abstract class $NAME { $$$ }'
      }
    });

    // Combine all found classes
    return [...regularClasses, ...abstractClasses, ...exportedAbstractClasses];
  }

  extractClassName(classNode: any): string | undefined {
    Logger.debug('Extracting class name from node:', { result: classNode.text().substring(0, 100) + '...' });

    // Try different approaches to extract class name
    let className = classNode.getMatch('CLASS')?.text();
    if (className) {
      Logger.debug('Found class name using CLASS match:', { className });
      return className;
    }

    // Try to match the class declaration pattern directly
    const classText = classNode.text();
    const classMatch = classText.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (classMatch) {
      className = classMatch[1];
      Logger.debug('Found class name using regex:', { className });
      return className;
    }

    Logger.debug('Failed to extract class name');
    return undefined;
  }

  extractInterfaceName(classNode: any): string | undefined {
    return classNode.getMatch('INTERFACE')?.text();
  }

  extractParentClassName(classNode: any): string | undefined {
    return classNode.getMatch('PARENT')?.text();
  }

  isAbstractClass(classNode: any): boolean {
    const classText = classNode.text();
    const isAbstract = classText.includes('abstract class');
    return isAbstract;
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

      Logger.debug(`Found ${constructorNodes.length} constructor nodes`);

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

      Logger.debug(`Found ${paramNodes.length} parameter nodes`);

      for (const paramNode of paramNodes) {
        const paramText = paramNode.text();
        Logger.debug('Parameter text:', paramText);

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

          Logger.debug(`Extracted parameter: ${name}: ${type}${optional ? '?' : ''} (${accessModifier || 'none'})`);
        }
      }
    } catch (error) {
      Logger.warn('Warning: Could not extract constructor parameters:', { error });
    }

    Logger.debug('Final parameters:', { parameters });
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

      Logger.debug(`Found ${comments.length} comments in file`);

      // Find all class declarations
      const classDeclarations = root.findAll({
        rule: {
          kind: 'class_declaration'
        }
      });

      Logger.debug(`Found ${classDeclarations.length} class declarations in file`);

      for (const comment of comments) {
        const commentText = comment.text();
        Logger.debug(`Comment text: ${commentText}`);

        if (commentText.includes('/**') && commentText.includes('@scope')) {
          Logger.debug(`Found @scope comment: ${commentText}`);
          const scopeMatch = commentText.match(/@scope\s+(singleton|transient)/);
          if (scopeMatch) {
            const scope = scopeMatch[1] as InjectionScope;
            const commentRange = comment.range();
            Logger.debug(`Comment range: line ${commentRange.start.line} to ${commentRange.end.line}`);

            // Find the class declaration that comes immediately after this comment
            for (const classDecl of classDeclarations) {
              const classRange = classDecl.range();
              Logger.debug(`Class range: line ${classRange.start.line} to ${classRange.end.line}`);

              // Check if the class comes after the comment
              if (classRange.start.line > commentRange.end.line) {
                const className = this.extractClassName(classDecl);
                Logger.debug(`Attempting to extract class name from class at line ${classRange.start.line}`);
                Logger.debug(`Extracted class name: ${className}`);
                if (className) {
                  Logger.debug(`Found JSDoc scope annotation: ${className} -> ${scope}`);
                  classScopes.set(className, scope);
                  break; // Take the first class after this comment
                } else {
                  Logger.debug(`Failed to extract class name from class declaration`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      Logger.warn('Warning: Could not extract JSDoc comments:', { error });
    }

    Logger.debug(`Final classScopes map:`, { classScopes });
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

      Logger.debug(`Found ${allImports.length} total import statements`);

      for (const importNode of allImports) {
        const importText = importNode.text();
        Logger.debug(`Import statement: ${importText}`);

        // Manual regex parsing - handles variable whitespace
        const aliasMatch = importText.match(/import\s*{\s*([\w]+)\s+as\s+([\w]+)\s*}\s+from/);
        if (aliasMatch) {
          const [, original, alias] = aliasMatch;
          typeAliases.set(alias.trim(), original.trim());
          Logger.debug(`Manual regex found type alias: ${alias.trim()} -> ${original.trim()}`);
        }
      }
    } catch (error) {
      Logger.warn('Warning: Could not extract type aliases:', { error });
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

      Logger.debug(`Found ${allImports.length} import statements for mapping`);

      for (const importNode of allImports) {
        const importText = importNode.text();
        Logger.debug(`Processing import: ${importText}`);

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
              Logger.debug(`Mapped alias ${alias.trim()} -> ${importPath}`);
            } else {
              importMappings.set(trimmed, importPath);
              Logger.debug(`Mapped named import ${trimmed} -> ${importPath}`);
            }
          }
        }

        // Default imports: import A from './path'
        const defaultImportMatch = importText.match(/import\s+([\w]+)\s+from/);
        if (defaultImportMatch && !namedImportsMatch) {
          const defaultImport = defaultImportMatch[1];
          importMappings.set(defaultImport, importPath);
          Logger.debug(`Mapped default import ${defaultImport} -> ${importPath}`);
        }
      }
    } catch (error) {
      Logger.warn('Warning: Could not extract import mappings:', { error });
    }

    Logger.debug(`Final import mappings:`, { importMappings });
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

      Logger.debug(`Found ${interfaceNodes.length} interface declarations`);

      for (const interfaceNode of interfaceNodes) {
        const interfaceText = interfaceNode.text();
        Logger.debug(`Interface text: ${interfaceText}`);

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
          if (methodNodes.length > 0) {
            interfaces.push(interfaceName);
            Logger.debug(`Found valid interface: ${interfaceName} with ${methodNodes.length} methods `);
          } else {
            Logger.debug(`Skipping empty interface: ${interfaceName}`);
          }
        }
      }
    } catch (error) {
      Logger.warn('Warning: Could not extract interfaces:', { error });
    }

    Logger.debug(`Final interfaces:`, { interfaces });
    return interfaces;
  }

  findAllFunctions(root: any): any[] {
    const functions: any[] = [];

    try {
      // Try multiple approaches to find functions
      // Approach 1: Direct function_declaration kind
      let functionDeclarations: any[] = [];
      try {
        functionDeclarations = root.findAll({
          rule: {
            kind: 'function_declaration'
          }
        });
      } catch (e) {
        Logger.debug('Could not find function_declaration by kind');
      }

      // Approach 2: Use pattern matching for exported functions
      try {
        const exportedFunctions = root.findAll({
          rule: {
            pattern: 'export function $NAME($$$PARAMS) $$$BODY'
          }
        });
        Logger.debug(`Found ${exportedFunctions.length} exported functions via pattern`);
        for (const func of exportedFunctions) {
          // Check if we already have this function
          const funcRange = func.range();
          const alreadyExists = functionDeclarations.some((f: any) => {
            const fRange = f.range();
            return fRange.start.line === funcRange.start.line;
          });
          if (!alreadyExists) {
            functionDeclarations.push(func);
          }
        }
      } catch (e) {
        Logger.debug('Could not find exported functions via pattern');
      }

      // Approach 3: Use pattern for non-exported functions
      try {
        const regularFunctions = root.findAll({
          rule: {
            pattern: 'function $NAME($$$PARAMS) $$$BODY'
          }
        });
        Logger.debug(`Found ${regularFunctions.length} regular functions via pattern`);
        for (const func of regularFunctions) {
          const funcText = func.text();
          // Skip if it's already exported (to avoid duplicates)
          if (!funcText.includes('export')) {
            const funcRange = func.range();
            const alreadyExists = functionDeclarations.some((f: any) => {
              const fRange = f.range();
              return fRange.start.line === funcRange.start.line;
            });
            if (!alreadyExists) {
              functionDeclarations.push(func);
            }
          }
        }
      } catch (e) {
        Logger.debug('Could not find regular functions via pattern');
      }

      // Find variable declarations that might be arrow functions
      const variableDeclarations = root.findAll({
        rule: {
          kind: 'variable_declaration'
        }
      });

      // Filter variable declarations to find arrow functions
      const arrowFunctions: any[] = [];
      for (const varDecl of variableDeclarations) {
        const varText = varDecl.text();
        // Check if it's an arrow function assignment
        if (varText.includes('=>') && (varText.includes('const') || varText.includes('export'))) {
          arrowFunctions.push(varDecl);
        }
      }

      Logger.debug(`Found ${functionDeclarations.length} function declarations and ${arrowFunctions.length} arrow functions`);
      return [...functionDeclarations, ...arrowFunctions];
    } catch (error) {
      Logger.warn('Warning: Could not find functions:', { error });
      return functions;
    }
  }

  extractFunctionName(functionNode: any): string | undefined {
    try {
      // Try to get name from match
      let functionName = functionNode.getMatch('NAME')?.text();
      if (functionName) {
        return functionName;
      }

      // Try to extract from function declaration
      const functionText = functionNode.text();

      // First, try to find identifier directly in the function node
      const identifier = functionNode.find({
        rule: {
          kind: 'identifier'
        }
      });
      if (identifier) {
        const name = identifier.text();
        // Make sure it's the function name, not a parameter
        // Function name comes before parameters
        const funcMatch = functionText.match(/function\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (funcMatch && funcMatch[1] === name) {
          return name;
        }
      }

      // Try regex extraction from function declaration (works for both exported and non-exported)
      const functionMatch = functionText.match(/(?:export\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (functionMatch) {
        return functionMatch[1];
      }

      // For variable declarations (arrow functions), find the variable name
      const varDecl = functionNode.find({
        rule: {
          kind: 'variable_declaration'
        }
      });

      if (varDecl) {
        const declarators = varDecl.findAll({
          rule: {
            kind: 'variable_declarator'
          }
        });
        if (declarators.length > 0) {
          const varIdentifier = declarators[0].find({
            rule: {
              kind: 'identifier'
            }
          });
          if (varIdentifier) {
            return varIdentifier.text();
          }
        }
      }

      // Try to extract from arrow function using regex
      const arrowMatch = functionText.match(/(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (arrowMatch) {
        return arrowMatch[1];
      }

      return undefined;
    } catch (error) {
      Logger.warn('Warning: Could not extract function name:', { error });
      return undefined;
    }
  }

  extractFunctionParameters(functionNode: any): ConstructorParameter[] {
    const parameters: ConstructorParameter[] = [];

    try {
      // Find formal parameters
      const parameterNodes = functionNode.findAll({
        rule: {
          kind: 'formal_parameters'
        }
      });

      if (parameterNodes.length === 0) {
        return parameters;
      }

      const formalParams = parameterNodes[0];

      // Find individual parameters
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

      for (const paramNode of paramNodes) {
        const paramText = paramNode.text();
        Logger.debug('Function parameter text:', paramText);

        // Parse parameter: name: type
        const paramMatch = paramText.match(/(\w+)(\?)?\s*:\s*(\w+)/);

        if (paramMatch) {
          const [, name, optional, type] = paramMatch;

          parameters.push({
            name: name.trim(),
            type: type.trim(),
            isOptional: !!optional,
          });
        }
      }
    } catch (error) {
      Logger.warn('Warning: Could not extract function parameters:', { error });
    }

    return parameters;
  }

  extractFunctionReturnType(functionNode: any): string | undefined {
    try {
      const functionText = functionNode.text();

      // Try to extract return type annotation
      const returnTypeMatch = functionText.match(/:\s*([A-Za-z_][A-Za-z0-9_<>[\],\s]*)/);
      if (returnTypeMatch) {
        return returnTypeMatch[1].trim();
      }

      return undefined;
    } catch (error) {
      Logger.warn('Warning: Could not extract function return type:', { error });
      return undefined;
    }
  }

  isExportedFunction(functionNode: any): boolean {
    try {
      const functionText = functionNode.text();
      // Check if the function text itself includes export
      if (functionText.includes('export')) {
        return true;
      }

      // Check parent nodes - exported functions might be wrapped
      let parent = functionNode.parent();
      let depth = 0;
      while (parent && depth < 5) {
        const parentText = parent.text();
        if (parentText.includes('export')) {
          return true;
        }
        parent = parent.parent();
        depth++;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}