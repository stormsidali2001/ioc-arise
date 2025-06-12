import { AnalyzerOptions, ClassInfo } from '../types';
import { ClassAnalyzer } from './class-analyzer';
import { FileDiscovery } from './file-discovery';


export class ProjectAnalyzer {
  private fileDiscovery: FileDiscovery;
  private classAnalyzer: ClassAnalyzer;

  constructor(options: AnalyzerOptions) {
    this.fileDiscovery = new FileDiscovery(options.sourceDir, options.excludePatterns);
    this.classAnalyzer = new ClassAnalyzer(options.sourceDir, options.interfacePattern);
  }

  async analyzeProject(): Promise<ClassInfo[]> {
    const tsFiles = await this.fileDiscovery.findTypeScriptFiles();
    
    const fileAnalysisPromises = tsFiles.map(filePath => 
      this.classAnalyzer.analyzeFile(filePath)
    );
    
    const fileClassesArrays = await Promise.all(fileAnalysisPromises);
    const allClasses = fileClassesArrays.flat();

    // Filter classes to only include those that are used as dependencies
    const filteredClasses = this.filterClassesByDependencyUsage(allClasses);

    // Validate that no interface is implemented by multiple classes
    this.validateUniqueInterfaceImplementations(filteredClasses);

    return filteredClasses;
  }

  private filterClassesByDependencyUsage(classes: ClassInfo[]): ClassInfo[] {
    // Collect all dependencies from all classes
    const allDependencies = new Set<string>();
    
    for (const classInfo of classes) {
      for (const dependency of classInfo.dependencies) {
        allDependencies.add(dependency);
      }
    }

    // Filter classes to only include:
    // 1. Classes that implement interfaces (these are typically services/repositories)
    // 2. Classes without interfaces that are used as dependencies by other classes
    return classes.filter(classInfo => {
      // Always include classes with interfaces
      if (classInfo.interfaceName) {
        return true;
      }
      
      // For classes without interfaces, only include if they are used as dependencies
      return allDependencies.has(classInfo.name);
    });
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
        console.error(`Error: Interface '${interfaceName}' is implemented by multiple classes:`);
        for (const classInfo of implementingClasses) {
          console.error(`  - ${classInfo.name} (${classInfo.filePath})`);
        }
      }
    }

    if (duplicateInterfaces.length > 0) {
      throw new Error(
        `Multiple classes implement the same interface(s): ${duplicateInterfaces.join(', ')}. ` +
        'Each interface should only be implemented by one class for proper dependency injection.'
      );
    }
  }
}
