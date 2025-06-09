import { ClassInfo } from '../types';
import { toVariableName } from '../utils/naming';

export class ContainerGenerator {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  generateContainerObject(): string {
    const singletonProperties: string[] = [];
    const transientProperties: string[] = [];

    for (const classInfo of this.classes) {
      const variableName = toVariableName(classInfo.name);
      const interfaceName = classInfo.interfaceName || classInfo.name;
      
      if (classInfo.scope === 'singleton') {
        singletonProperties.push(`  ${interfaceName}: ${variableName},`);
      } else if (classInfo.scope === 'transient') {
        transientProperties.push(`  get ${interfaceName}(): ${classInfo.name} {
    return ${variableName}Factory();
  },`);
      }
    }

    const allProperties = [...singletonProperties, ...transientProperties];
    return `export const container = {\n${allProperties.join('\n')}\n};`;
  }

  generateTypeExport(): string {
    return 'export type Container = typeof container;';
  }
}