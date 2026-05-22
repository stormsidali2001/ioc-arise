import { ClassInfo, FactoryInfo, ValueInfo } from '../../domain/types';
import { ErrorFactory } from '../../errors/errorFactory';

export interface TokenSets {
  interfaceNames: Set<string>;
  abstractClassNames: Set<string>;
  classNames: Set<string>;
}

/**
 * Computes the three token sets needed by all printers and validates for
 * class name collisions before generation.
 */
export class RegistrationPlanner {
  static buildTokenSets(
    classes: ClassInfo[],
    factories?: FactoryInfo[],
    values?: ValueInfo[]
  ): TokenSets {
    const interfaceNames = new Set<string>();
    const abstractClassNames = new Set<string>();
    const classNames = new Set(classes.map((c) => c.name));

    classes.forEach((cls) => {
      if (cls.interfaceName) interfaceNames.add(cls.interfaceName);
      // Abstract class deps (heuristic kept from original)
      cls.dependencies.forEach((dep) => {
        if (
          !classNames.has(dep.name) &&
          (dep.name.startsWith('Abstract') || dep.name.includes('Abstract'))
        ) {
          abstractClassNames.add(dep.name);
        }
      });
    });

    factories?.forEach((f) => {
      if (f.instanceFactoryFor) interfaceNames.add(f.instanceFactoryFor);
      const token = f.token ?? f.name;
      if (token) interfaceNames.add(token);
    });

    values?.forEach((v) => {
      const token = v.token ?? v.interfaceName ?? v.name;
      if (token) interfaceNames.add(token);
    });

    return { interfaceNames, abstractClassNames, classNames };
  }

  static checkNameCollisions(classes: ClassInfo[]): void {
    const seen = new Map<string, ClassInfo[]>();
    for (const cls of classes) {
      const bucket = seen.get(cls.name) ?? [];
      bucket.push(cls);
      seen.set(cls.name, bucket);
    }
    for (const [name, bucket] of seen) {
      if (bucket.length > 1) {
        throw ErrorFactory.classNameCollision(
          name,
          bucket.map((c) => c.filePath)
        );
      }
    }
  }
}
