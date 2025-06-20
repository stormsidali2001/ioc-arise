import { AnalyzerOptions, ClassInfo } from '../types';
import { ClassAnalyzer } from './class-analyzer';
import { FileDiscovery } from './file-discovery';
import { ErrorFactory, ErrorUtils } from '../errors/index.js';


export class ProjectAnalyzer {
  private fileDiscovery: FileDiscovery;
  private classAnalyzer: ClassAnalyzer;

  constructor(options: AnalyzerOptions) {
    this.fileDiscovery = new FileDiscovery(options.sourceDir, options.excludePatterns);
    this.classAnalyzer = new ClassAnalyzer(options.sourceDir, options.interfacePattern);
  }

  async analyzeProject(): Promise<ClassInfo[]> {
    const tsFiles = await this.fileDiscovery.findTypeScriptFiles();
    
    // Analyze all files in a single batch operation for better performance
    const allClasses = await this.classAnalyzer.analyzeFiles(tsFiles);


    // Validate that no interface is implemented by multiple classes
    this.validateUniqueInterfaceImplementations(allClasses);

    return allClasses;
  }


  private validateUniqueInterfaceImplementations(classes: ClassInfo[]): void {
    const interfaceToClassMap = new Map<string, ClassInfo[]>();
    
    // Group classes by their interface names
    for (const classInfo of classes) {
      if (classInfo.interfaceName) {
        if (!interfaceToClassMap.has(classInfo.interfaceName)) {
          interfaceToClassMap.set(classInfo.interfaceName, []);
        }
        interfaceToClassMap.get(classInfo.interfaceName)!.push(classInfo);
      }
    }

    // Check for duplicate implementations
    const duplicateInterfaces: string[] = [];
    for (const [interfaceName, implementingClasses] of interfaceToClassMap) {
      if (implementingClasses.length > 1) {
        duplicateInterfaces.push(interfaceName);
        const error = ErrorFactory.duplicateInterfaceImplementation(
          interfaceName,
          implementingClasses.map(c => c.name)
        );
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
        for (const classInfo of implementingClasses) {
          console.error(`   • ${classInfo.name} (${classInfo.filePath})`);
        }
      }
    }

    if (duplicateInterfaces.length > 0) {
      const allClassNames: string[] = [];
      
      for (const [interfaceName, implementingClasses] of interfaceToClassMap) {
        if (implementingClasses.length > 1) {
          allClassNames.push(...implementingClasses.map(c => c.name));
        }
      }
      
      throw ErrorFactory.duplicateInterfaceImplementation(
        duplicateInterfaces.join(', '),
        allClassNames
      );
    }
  }
}
