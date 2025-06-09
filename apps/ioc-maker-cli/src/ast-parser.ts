import { readFileSync } from 'fs';
import { ts } from '@ast-grep/napi';
import { ConstructorParameter } from './types';

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
    return classNode.getMatch('CLASS')?.text();
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