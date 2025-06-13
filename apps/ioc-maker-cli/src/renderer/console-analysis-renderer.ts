import { RenderAnalysis, AnalysisResults } from './render-analysis.interface';
import { ClassInfo } from '../types';

// ANSI color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
};

export class ConsoleAnalysisRenderer implements RenderAnalysis {
  render(results: AnalysisResults): void {
    this.renderHeader(results);
    this.renderDependencyGraph(results.classes);
    this.renderCircularDependencies(results.circularDependencies);
    this.renderFooter();
  }

  private renderHeader(results: AnalysisResults): void {
    const width = 60;
    const title = '📊 DEPENDENCY ANALYSIS VISUALIZATION';
    const padding = Math.max(0, Math.floor((width - title.length) / 2));
    
    console.log('\n' + colors.cyan + '╔' + '═'.repeat(width - 2) + '╗' + colors.reset);
    console.log(colors.cyan + '║' + ' '.repeat(padding) + colors.bright + colors.white + title + colors.reset + colors.cyan + ' '.repeat(width - 2 - padding - title.length) + '║' + colors.reset);
    console.log(colors.cyan + '╠' + '═'.repeat(width - 2) + '╣' + colors.reset);
    
    const stats = [
      `${colors.blue}📦 Total Classes: ${colors.bright}${results.classes.length}${colors.reset}`,
      `${colors.yellow}🔄 Circular Dependencies: ${results.circularDependencies.length > 0 ? colors.red + colors.bright : colors.green + colors.bright}${results.circularDependencies.length}${colors.reset}`
    ];
    
    stats.forEach(stat => {
      const cleanStat = stat.replace(/\x1b\[[0-9;]*m/g, '');
      const statPadding = Math.max(0, Math.floor((width - 2 - cleanStat.length) / 2));
      console.log(colors.cyan + '║' + ' '.repeat(statPadding) + stat + ' '.repeat(width - 2 - statPadding - cleanStat.length) + colors.cyan + '║' + colors.reset);
    });
    
    console.log(colors.cyan + '╚' + '═'.repeat(width - 2) + '╝' + colors.reset + '\n');
  }

  private renderDependencyGraph(classes: ClassInfo[]): void {
    console.log(colors.magenta + colors.bright + '🌐 DEPENDENCY GRAPH' + colors.reset);
    console.log(colors.magenta + '━'.repeat(40) + colors.reset);
    
    if (classes.length === 0) {
      console.log(colors.gray + '   📭 No classes found.' + colors.reset + '\n');
      return;
    }

    // Group classes by their dependency count for better visualization
    const classesWithDeps = classes.filter(cls => cls.dependencies.length > 0);
    const classesWithoutDeps = classes.filter(cls => cls.dependencies.length === 0);

    // Render classes without dependencies first (leaf nodes)
    if (classesWithoutDeps.length > 0) {
      console.log('\n' + colors.green + colors.bright + '🍃 Leaf Nodes' + colors.reset + colors.gray + ' (No Dependencies)' + colors.reset);
      console.log(colors.green + '┌' + '─'.repeat(38) + '┐' + colors.reset);
      
      classesWithoutDeps.forEach((cls, index) => {
        const isLast = index === classesWithoutDeps.length - 1;
        const connector = isLast ? '└─' : '├─';
        const formattedClass = this.formatClassName(cls, 'leaf');
        const truncatedClass = this.truncateText(formattedClass, 34);
        console.log(colors.green + '│ ' + connector + ' ' + colors.reset + truncatedClass);
      });
      
      console.log(colors.green + '└' + '─'.repeat(38) + '┘' + colors.reset);
    }

    // Render classes with dependencies
    if (classesWithDeps.length > 0) {
      console.log('\n' + colors.blue + colors.bright + '🔗 Dependency Tree' + colors.reset);
      console.log(colors.blue + '┌' + '─'.repeat(38) + '┐' + colors.reset);
      
      classesWithDeps.forEach((cls, index) => {
        const isLast = index === classesWithDeps.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const formattedClass = this.formatClassName(cls, 'parent');
        const truncatedClass = this.truncateText(formattedClass, 34);
        
        console.log(colors.blue + '│ ' + prefix + ' ' + colors.reset + truncatedClass);
        
        cls.dependencies.forEach((dep, depIndex) => {
          const isLastDep = depIndex === cls.dependencies.length - 1;
          const depPrefix = isLast ? '   ' : '│  ';
          const depSymbol = isLastDep ? '└─' : '├─';
          const truncatedDep = this.truncateText(dep.name, 26);
          
          console.log(colors.blue + '│ ' + depPrefix + ' ' + colors.cyan + depSymbol + ' 🔗 ' + colors.yellow + truncatedDep + colors.reset);
        });
        
        if (!isLast && cls.dependencies.length > 0) {
          console.log(colors.blue + '│' + colors.reset);
        }
      });
      
      console.log(colors.blue + '└' + '─'.repeat(38) + '┘' + colors.reset);
    }

    console.log('');
  }

  private renderCircularDependencies(cycles: string[][]): void {
    console.log(colors.red + colors.bright + '🔄 CIRCULAR DEPENDENCIES' + colors.reset);
    console.log(colors.red + '━'.repeat(40) + colors.reset);
    
    if (cycles.length === 0) {
      console.log(colors.green + '┌' + '─'.repeat(38) + '┐' + colors.reset);
      console.log(colors.green + '│ ' + colors.bright + '✅ No circular dependencies!' + colors.reset + colors.green + '     │' + colors.reset);
      console.log(colors.green + '└' + '─'.repeat(38) + '┘' + colors.reset + '\n');
      return;
    }

    console.log(colors.red + '┌' + '─'.repeat(38) + '┐' + colors.reset);
    console.log(colors.red + '│ ' + colors.bright + colors.yellow + '⚠️  Found ' + cycles.length + ' cycle(s)' + colors.reset + colors.red + '           │' + colors.reset);
    console.log(colors.red + '├' + '─'.repeat(38) + '┤' + colors.reset);
    
    cycles.forEach((cycle, index) => {
      const cycleStr = cycle.join(' → ') + ' → ' + cycle[0];
      const truncatedCycle = this.truncateText(cycleStr, 32);
      console.log(colors.red + '│ ' + colors.bright + (index + 1) + '. ' + colors.reset + colors.yellow + '🔄 ' + truncatedCycle + colors.reset);
      if (index < cycles.length - 1) {
        console.log(colors.red + '│' + ' '.repeat(38) + '│' + colors.reset);
      }
    });
    
    console.log(colors.red + '└' + '─'.repeat(38) + '┘' + colors.reset + '\n');
  }

  private formatClassName(cls: ClassInfo, type: 'leaf' | 'parent' = 'parent'): string {
    const className = colors.bright + colors.white + cls.name + colors.reset;
    const interfaceInfo = cls.interfaceName ? 
      colors.gray + ' → ' + colors.cyan + cls.interfaceName + colors.reset : '';
    const depCount = cls.dependencies.length > 0 ? 
      colors.gray + ' [' + colors.yellow + cls.dependencies.length + colors.gray + ']' + colors.reset : '';
    
    const icon = type === 'leaf' ? '🌿' : '📦';
    return `${icon} ${className}${interfaceInfo}${depCount}`;
  }

  private truncateText(text: string, maxLength: number): string {
    // Remove ANSI color codes for length calculation
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
    if (cleanText.length <= maxLength) {
      return text;
    }
    
    // Find a good truncation point, preserving color codes
    const truncated = cleanText.substring(0, maxLength - 3) + '...';
    
    // Reconstruct with original color codes up to truncation point
    let result = '';
    let cleanIndex = 0;
    let i = 0;
    
    while (i < text.length && cleanIndex < maxLength - 3) {
      if (text[i] === '\x1b') {
        // Copy color code
        const colorMatch = text.substring(i).match(/^\x1b\[[0-9;]*m/);
        if (colorMatch) {
          result += colorMatch[0];
          i += colorMatch[0].length;
          continue;
        }
      }
      result += text[i];
      cleanIndex++;
      i++;
    }
    
    return result + '...' + colors.reset;
  }

  private renderFooter(): void {
    console.log(colors.gray + '─'.repeat(60) + colors.reset);
    console.log(colors.gray + '💡 🌿 = Leaf nodes, 📦 = Classes with deps, 🔗 = Dependencies' + colors.reset);
    console.log(colors.gray + '✨ Analysis complete!' + colors.reset + '\n');
  }
}