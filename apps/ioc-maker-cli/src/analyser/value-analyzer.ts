import { relative } from 'path';
import { ValueInfo, InjectionScope } from '../types';
import { ASTParser } from './ast-parser';
import { container } from '../container';
import { Logger } from '../utils/logger';

export class ValueAnalyzer {
    private astParser: ASTParser;
    private sourceDir: string;

    constructor(sourceDir: string) {
        this.astParser = container.astParser;
        this.sourceDir = sourceDir;
    }

    async analyzeFiles(filePaths: string[]): Promise<ValueInfo[]> {
        const allValues: ValueInfo[] = [];
        const allInterfaces = new Set<string>();
        const fileASTMap = new Map<string, any>();

        // First pass: Collect interfaces for type checking
        for (const filePath of filePaths) {
            try {
                const root = this.astParser.parseFile(filePath);
                fileASTMap.set(filePath, root);

                const interfaces = this.astParser.extractInterfaces(root);
                interfaces.forEach(interfaceName => allInterfaces.add(interfaceName));
            } catch (error) {
                Logger.warn(`Warning: Could not parse ${filePath}:`, { error });
            }
        }

        // Second pass: Analyze exported const values
        for (const filePath of filePaths) {
            const root = fileASTMap.get(filePath);
            if (root) {
                const values = await this.analyzeFileFromAST(filePath, root, allInterfaces);
                allValues.push(...values);
            }
        }

        return allValues;
    }

    private async analyzeFileFromAST(
        filePath: string,
        root: any,
        allInterfaces: Set<string>
    ): Promise<ValueInfo[]> {
        const values: ValueInfo[] = [];

        try {
            const exportedValues = this.astParser.findAllExportedValues(root);
            Logger.debug(`Found ${exportedValues.length} exported values in ${filePath}`);

            for (const valueNode of exportedValues) {
                const valueName = this.astParser.extractValueName(valueNode);
                if (!valueName) {
                    continue;
                }

                const interfaceName = this.astParser.extractValueType(valueNode);
                
                // Only include values that implement known interfaces
                if (interfaceName && allInterfaces.has(interfaceName)) {
                    // Calculate import path
                    const importPath = this.calculateImportPath(filePath);

                    // Determine token - use interface name if available, otherwise use value name
                    const token = interfaceName || valueName;

                    // useValue is always singleton
                    const scope: InjectionScope = 'singleton';

                    values.push({
                        name: valueName,
                        filePath,
                        interfaceName,
                        importPath,
                        scope,
                        token,
                    });
                }
            }
        } catch (error) {
            Logger.warn(`Warning: Could not analyze values in ${filePath}:`, { error });
        }

        return values;
    }

    private calculateImportPath(filePath: string): string {
        const relativePath = relative(this.sourceDir, filePath);
        const pathWithoutExt = relativePath.replace(/\.ts$/, '');
        // Convert to relative import path (./path/to/file)
        return `./${pathWithoutExt}`;
    }
}

