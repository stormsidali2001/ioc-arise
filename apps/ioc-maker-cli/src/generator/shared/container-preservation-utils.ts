import { existsSync } from 'fs';
import { ASTParser } from '../../analyser/ast-parser';
import { logger } from '@notjustcoders/one-logger-client-sdk';

/**
 * Utility class for preserving user content from existing container files.
 * Handles parsing existing containers to extract and preserve custom onInit logic.
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
    } {
        return {
            onInitBody: this.extractOnInitBody(containerPath)
        };
    }
} 