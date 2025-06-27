/**
 * Utility class for generating path-based injection helpers.
 * Provides TypeScript type-safe path navigation and injection utilities.
 */
export class PathInjectionUtils {
    /**
     * Generates the recursive Paths type for traversing object types.
     */
    static generatePathsType(): string {
        return `// 🎯 Auto-generate all possible paths using TypeScript
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T]: K extends string
    ? T[K] extends object
      ? Prefix extends ""
        ? K | \`\${K}.\${Paths<T[K]>}\`
        : \`\${Prefix}.\${K}\` | \`\${Prefix}.\${K}.\${Paths<T[K]>}\`
      : Prefix extends ""
        ? K
        : \`\${Prefix}.\${K}\`
    : never;
}[keyof T];`;
    }

    /**
     * Generates the ContainerKey type that applies Paths to the Container type.
     */
    static generateContainerKeyType(): string {
        return `// ✨ All container keys automatically derived!
export type ContainerKey = Paths<Container>;`;
    }

    /**
     * Generates the GetByPath type for resolving return types using template literals.
     */
    static generateGetByPathType(): string {
        return `// 🎯 Auto-resolve return types using template literals
type GetByPath<T, P extends string> = 
  P extends keyof T
    ? T[P]
    : P extends \`\${infer K}.\${infer Rest}\`
      ? K extends keyof T
        ? GetByPath<T[K], Rest>
        : never
      : never;`;
    }

    /**
     * Generates the initialization tracking variable and onInit function.
     * @param customOnInitBody Optional custom body for the onInit function to preserve user changes
     */
    static generateInitializationCode(customOnInitBody?: string): string {
        const onInitBody = customOnInitBody || '  // TODO: Implement your post-construction logic here';

        return `const CONTAINER_INIT_KEY = Symbol.for('ioc-container-initialized');

export function onInit(): void {
${onInitBody}
}`;
    }

    /**
     * Generates the inject function with type-safe path resolution.
     */
    static generateInjectFunction(): string {
        return `export function inject<T extends ContainerKey>(key: T): GetByPath<Container, T> {
  if (!(globalThis as any)[CONTAINER_INIT_KEY]) {
    onInit();
    (globalThis as any)[CONTAINER_INIT_KEY] = true;
  }
  
  // Parse path and traverse object
  const parts = key.split('.');
  let current: any = container;
  
  for (const part of parts) {
    current = current[part];
  }
  
  return current;
}`;
    }

    /**
     * Generates all path-based injection utilities as a complete code block.
     * @param customOnInitBody Optional custom body for the onInit function to preserve user changes
     * @param preservedImports Optional array of import statements to preserve for onInit dependencies
     */
    static generatePathInjectionUtilities(customOnInitBody?: string, preservedImports?: string[]): string {
        const pathsType = this.generatePathsType();
        const containerKeyType = this.generateContainerKeyType();
        const getByPathType = this.generateGetByPathType();
        const initializationCode = this.generateInitializationCode(customOnInitBody);
        const injectFunction = this.generateInjectFunction();

        // Include preserved imports if any
        const importsSection = preservedImports && preservedImports.length > 0
            ? preservedImports.join('\n') + '\n\n'
            : '';

        return `${importsSection}${pathsType}

${containerKeyType}

${getByPathType}

${initializationCode}

${injectFunction}`;
    }
} 