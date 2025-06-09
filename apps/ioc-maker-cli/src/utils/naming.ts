/**
 * Converts PascalCase class names to camelCase variable names
 * @param className - The class name in PascalCase
 * @returns The variable name in camelCase
 */
export function toVariableName(className: string): string {
  return className.charAt(0).toLowerCase() + className.slice(1);
}