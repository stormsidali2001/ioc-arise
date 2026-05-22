import { ClassInfo } from '../domain/types';
import { DependencyResolver } from '../analysis/DependencyResolver';
import { ModuleDependencyResolver } from '../analysis/ModuleDependencyResolver';

export class DetectCyclesUseCase {
  detectClassCycles(classes: ClassInfo[]): string[][] {
    return new DependencyResolver(classes).detectCircularDependencies();
  }

  detectModuleCycles(
    moduleGroupedClasses: Map<string, ClassInfo[]>
  ): string[][] {
    return new ModuleDependencyResolver(moduleGroupedClasses)
      .resolve()
      .cycles;
  }
}
