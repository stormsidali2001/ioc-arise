import { existsSync } from 'fs';
import { ASTParser } from '../../analyser/ast-parser';
import { logger } from '@notjustcoders/one-logger-client-sdk';

/**
 * Utility class for preserving user content from existing container files.
 * Handles parsing existing containers to extract and preserve custom onInit logic and its dependencies.
 */
export class ContainerPreservationUtils {
    private static astParser = new ASTParser();

    /**
     * Extracts the body of the onInit function from an existing container file.
     * @param containerPath Path to the existing container file
     * @returns The body content of the onInit function, or undefined if not found
     */
    static extractOnInitBody(containerPath: string): string | undefined {
        try {
            // Check if file exists
            if (!existsSync(containerPath)) {
                logger.log('Container file does not exist, using default onInit body');
                return undefined;
            }

            // Parse the existing container file
            const root = this.astParser.parseFile(containerPath);

            // Try multiple patterns to find the onInit function
            let onInitFunctions = root.findAll({
                rule: {
                    pattern: 'export function onInit(): void { $$$ }'
                }
            });

            // If not found, try without export keyword
            if (onInitFunctions.length === 0) {
                onInitFunctions = root.findAll({
                    rule: {
                        pattern: 'function onInit(): void { $$$ }'
                    }
                });
            }

            // If still not found, try to find any function named onInit
            if (onInitFunctions.length === 0) {
                onInitFunctions = root.findAll({
                    rule: {
                        kind: 'function_declaration'
                    }
                }).filter((func: any) => {
                    const funcText = func.text();
                    return funcText.includes('onInit') && funcText.includes('(): void');
                });
            }

            if (onInitFunctions.length === 0) {
                logger.log('No onInit function found in existing container');
                return undefined;
            }

            const onInitFunction = onInitFunctions[0];
            const functionText = onInitFunction.text();

            logger.log('Found onInit function:', { functionPreview: functionText.substring(0, 200) + '...' });

            // Extract the function body content between the curly braces
            // Use a more robust regex to handle multiline content
            const bodyMatch = functionText.match(/export\s+function\s+onInit\s*\(\s*\)\s*:\s*void\s*\{\s*([\s\S]*?)\s*\}$/m) ||
                functionText.match(/function\s+onInit\s*\(\s*\)\s*:\s*void\s*\{\s*([\s\S]*?)\s*\}$/m);

            if (!bodyMatch || !bodyMatch[1]) {
                logger.log('Could not extract onInit function body using regex');
                return undefined;
            }

            const bodyContent = bodyMatch[1].trim();

            logger.log('Extracted body content:', { bodyContent });

            // Check if it's just the default TODO comment
            if (bodyContent === '// TODO: Implement your post-construction logic here') {
                logger.log('Found default onInit body, not preserving');
                return undefined;
            }

            // If there's custom content, preserve it with proper indentation
            if (bodyContent.length > 0) {
                logger.log('Found custom onInit body, preserving it');
                // Add proper indentation to each line
                const indentedBody = bodyContent
                    .split('\n')
                    .map((line: string) => line.trim() ? `  ${line}` : line)
                    .join('\n');

                return indentedBody;
            }

            return undefined;
        } catch (error) {
            logger.warn('Warning: Could not parse existing container file for onInit preservation:', {
                error: error instanceof Error ? error.message : String(error),
                containerPath
            });
            return undefined;
        }
    }

    /**
     * Extracts imports that are used within the onInit function.
     * @param containerPath Path to the existing container file
     * @returns Array of import statements that are referenced in onInit
     */
    static extractOnInitRelatedImports(containerPath: string): string[] {
        try {
            // Check if file exists
            if (!existsSync(containerPath)) {
                logger.log('Container file does not exist, no imports to preserve');
                return [];
            }

            // Parse the existing container file
            const root = this.astParser.parseFile(containerPath);
            if (!root) {
                logger.log('Could not parse container file');
                return [];
            }

            // First, extract the onInit function body
            const onInitBody = this.extractOnInitBody(containerPath);
            if (!onInitBody) {
                logger.log('No custom onInit body found, no imports to preserve');
                return [];
            }

            // Get all import statements from the file
            const allImports = root.findAll({
                rule: {
                    kind: 'import_statement'
                }
            });

            if (!allImports || !Array.isArray(allImports)) {
                logger.log('No imports found in file');
                return [];
            }

            const preservedImports: string[] = [];
            const onInitBodyText = onInitBody.toLowerCase();

            for (const importNode of allImports) {
                if (!importNode || typeof importNode.text !== 'function') continue;

                const importText = importNode.text() as string;
                if (!importText) continue;

                logger.log('Checking import:', { importText });

                // Extract imported identifiers from the import statement
                const importedIdentifiers = this.extractImportedIdentifiers(importText);

                // Check if any of the imported identifiers are used in onInit
                const isUsedInOnInit = importedIdentifiers.some(identifier => {
                    const isUsed = onInitBodyText.includes(identifier.toLowerCase());
                    if (isUsed) {
                        logger.log('Found import used in onInit:', { identifier, importText });
                    }
                    return isUsed;
                });

                if (isUsedInOnInit) {
                    preservedImports.push(importText);
                }
            }

            logger.log('Preserved imports for onInit:', { preservedImports });
            return preservedImports;
        } catch (error) {
            logger.warn('Warning: Could not extract onInit-related imports:', {
                error: error instanceof Error ? error.message : String(error),
                containerPath
            });
            return [];
        }
    }

    /**
     * Extracts identifiers (class names, function names, etc.) from an import statement.
     * @param importStatement The import statement text
     * @returns Array of imported identifiers
     */
    private static extractImportedIdentifiers(importStatement: string): string[] {
        const identifiers: string[] = [];

        try {
            // Handle default imports: import Something from './path'
            const defaultImportMatch = importStatement.match(/import\s+([A-Za-z_][A-Za-z0-9_]*)\s+from/);
            if (defaultImportMatch && defaultImportMatch[1]) {
                identifiers.push(defaultImportMatch[1]);
            }

            // Handle named imports: import { A, B, C as D } from './path'
            const namedImportsMatch = importStatement.match(/import\s*{\s*([^}]+)\s*}\s*from/);
            if (namedImportsMatch && namedImportsMatch[1]) {
                const namedImports = namedImportsMatch[1].split(',');
                for (const namedImport of namedImports) {
                    const trimmed = namedImport.trim();
                    // Handle aliases: A as B -> we want B (the local name)
                    const aliasMatch = trimmed.match(/([A-Za-z_][A-Za-z0-9_]*)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)/);
                    if (aliasMatch && aliasMatch[2]) {
                        identifiers.push(aliasMatch[2]); // Use the alias name
                    } else {
                        // Regular named import
                        identifiers.push(trimmed);
                    }
                }
            }

            // Handle namespace imports: import * as Something from './path'
            const namespaceImportMatch = importStatement.match(/import\s*\*\s*as\s+([A-Za-z_][A-Za-z0-9_]*)\s+from/);
            if (namespaceImportMatch && namespaceImportMatch[1]) {
                identifiers.push(namespaceImportMatch[1]);
            }
        } catch (error) {
            logger.warn('Warning: Could not extract identifiers from import statement:', {
                error: error instanceof Error ? error.message : String(error),
                importStatement
            });
        }

        return identifiers;
    }

    /**
     * Checks if a container file exists at the given path.
     * @param containerPath Path to check for container file
     * @returns True if the file exists
     */
    static containerExists(containerPath: string): boolean {
        return existsSync(containerPath);
    }

    /**
     * Extracts preserved content for container regeneration.
     * @param containerPath Path to the existing container file
     * @returns Object containing preserved content
     */
    static extractPreservedContent(containerPath: string): {
        onInitBody?: string;
        onInitImports?: string[];
    } {
        return {
            onInitBody: this.extractOnInitBody(containerPath),
            onInitImports: this.extractOnInitRelatedImports(containerPath)
        };
    }
} 