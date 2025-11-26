import { AnalyzerOptions, ClassInfo, FactoryInfo, ValueInfo } from '../types';
import { ClassAnalyzer } from './class-analyzer';
import { FactoryAnalyzer } from './factory-analyzer';
import { ValueAnalyzer } from './value-analyzer';
import { FileDiscovery } from './file-discovery';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';


export class ProjectAnalyzer {
  private fileDiscovery: FileDiscovery;
  private classAnalyzer: ClassAnalyzer;
  private factoryAnalyzer: FactoryAnalyzer;
  private valueAnalyzer: ValueAnalyzer;

  constructor(options: AnalyzerOptions) {
    this.fileDiscovery = new FileDiscovery(options.sourceDir, options.excludePatterns);
    this.classAnalyzer = new ClassAnalyzer(options.sourceDir, options.interfacePattern);
    this.factoryAnalyzer = new FactoryAnalyzer(options.sourceDir);
    this.valueAnalyzer = new ValueAnalyzer(options.sourceDir);
  }

  async analyzeProject(): Promise<{ classes: ClassInfo[]; factories: FactoryInfo[]; values: ValueInfo[] }> {
    const tsFiles = await this.fileDiscovery.findTypeScriptFiles();

    // Analyze all files in a single batch operation for better performance
    const allClasses = await this.classAnalyzer.analyzeFiles(tsFiles);
    const allFactories = await this.factoryAnalyzer.analyzeFiles(tsFiles);
    const allValues = await this.valueAnalyzer.analyzeFiles(tsFiles);

    // Validate that no interface is implemented by multiple classes
    this.validateUniqueInterfaceImplementations(allClasses);

    // Validate that no abstract class is extended by multiple classes
    this.validateUniqueAbstractClassExtensions(allClasses);

    return { classes: allClasses, factories: allFactories, values: allValues };
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
        const { Logger } = require('../utils/logger');
        Logger.error(ErrorUtils.formatForConsole(error));
        for (const classInfo of implementingClasses) {
          Logger.log(`   • ${classInfo.name} (${classInfo.filePath})`);
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

  private validateUniqueAbstractClassExtensions(classes: ClassInfo[]): void {
    const abstractClassToClassMap = new Map<string, ClassInfo[]>();

    // Group classes by their abstract class names
    for (const classInfo of classes) {
      if (classInfo.abstractClassName) {
        if (!abstractClassToClassMap.has(classInfo.abstractClassName)) {
          abstractClassToClassMap.set(classInfo.abstractClassName, []);
        }
        abstractClassToClassMap.get(classInfo.abstractClassName)!.push(classInfo);
      }
    }

    // Check for duplicate extensions
    const duplicateAbstractClasses: string[] = [];
    for (const [abstractClassName, extendingClasses] of abstractClassToClassMap) {
      if (extendingClasses.length > 1) {
        duplicateAbstractClasses.push(abstractClassName);
        const error = ErrorFactory.duplicateAbstractClassExtension(
          abstractClassName,
          extendingClasses.map(c => c.name)
        );
        const { Logger } = require('../utils/logger');
        Logger.error(`Multiple classes extending abstract class: ${abstractClassName}`);
        for (const classInfo of extendingClasses) {
          Logger.log(`   • ${classInfo.name} (${classInfo.filePath})`);
        }
      }
    }

    if (duplicateAbstractClasses.length > 0) {
      const allClassNames: string[] = [];

      for (const [abstractClassName, extendingClasses] of abstractClassToClassMap) {
        if (extendingClasses.length > 1) {
          allClassNames.push(...extendingClasses.map(c => c.name));
        }
      }

      throw ErrorFactory.duplicateAbstractClassExtension(
        duplicateAbstractClasses.join(', '),
        allClassNames
      );
    }
  }
}
