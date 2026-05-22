import {
  Project,
  SourceFile,
  Node,
  VariableDeclarationKind,
  ClassDeclaration,
  FunctionDeclaration,
  ArrowFunction,
  FunctionExpression,
  VariableStatement,
  ParameterDeclaration,
} from 'ts-morph';
import {
  InjectionScope,
  RawClassData,
  RawFunctionData,
  RawValueData,
  RawParam,
  FileTokens,
  ParsedFile,
} from '../../domain/types';

export class TsMorphTypeParser {
  private project: Project;

  constructor(project?: Project) {
    this.project =
      project ??
      new Project({
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
          allowJs: false,
          skipLibCheck: true,
          noEmit: true,
        },
      });
  }

  parseFile(filePath: string): ParsedFile {
    let sf = this.project.getSourceFile(filePath);
    if (!sf) {
      sf = this.project.addSourceFileAtPath(filePath);
    }
    return this.parseSourceFile(sf);
  }

  parseContent(virtualPath: string, content: string): ParsedFile {
    const sf = this.project.createSourceFile(virtualPath, content, {
      overwrite: true,
    });
    return this.parseSourceFile(sf);
  }

  private parseSourceFile(sf: SourceFile): ParsedFile {
    return {
      filePath: sf.getFilePath(),
      classes: this.extractClasses(sf),
      functions: this.extractFunctions(sf),
      values: this.extractValues(sf),
      tokens: this.extractTokens(sf),
    };
  }

  // ── Classes ────────────────────────────────────────────────────────────────

  private extractClasses(sf: SourceFile): RawClassData[] {
    const result: RawClassData[] = [];

    for (const cls of sf.getClasses()) {
      const name = cls.getName();
      if (!name) continue;

      const isAbstract = cls.isAbstract();
      const implementsClause = cls.getImplements()[0];
      const implementsInterface = implementsClause
        ? implementsClause.getExpression().getText()
        : undefined;
      const extendsClause = cls.getExtends();
      const extendsClass = extendsClause
        ? extendsClause.getExpression().getText()
        : undefined;

      const ctors = cls.getConstructors();
      const constructorParams = ctors[0]
        ? this.extractConstructorParams(ctors[0].getParameters())
        : [];

      result.push({
        name,
        filePath: sf.getFilePath(),
        isAbstract,
        implementsInterface,
        extendsClass,
        constructorParams,
        jsDocScope: this.extractJsDocScopeFromNode(cls),
      });
    }

    return result;
  }

  private extractConstructorParams(params: ParameterDeclaration[]): RawParam[] {
    return params.map((p) => {
      const typeNode = p.getTypeNode();
      const typeText = typeNode?.getText() ?? '';
      // Extract first identifier word (mirrors current regex behavior)
      const type = typeText.match(/^(\w+)/)?.[1] ?? typeText;

      const modText = p
        .getModifiers()
        .map((m) => m.getText())
        .find((t) => t === 'private' || t === 'public' || t === 'protected');
      const accessModifier = modText as
        | 'private'
        | 'public'
        | 'protected'
        | undefined;

      return {
        name: p.getName(),
        type,
        isOptional: p.hasQuestionToken(),
        accessModifier,
      };
    });
  }

  // ── Functions (factories) ──────────────────────────────────────────────────

  private extractFunctions(sf: SourceFile): RawFunctionData[] {
    const result: RawFunctionData[] = [];

    // Regular function declarations
    for (const fn of sf.getFunctions()) {
      const name = fn.getName();
      if (!name) continue;

      result.push({
        name,
        filePath: sf.getFilePath(),
        isExported: fn.isExported(),
        returnType: fn.getReturnTypeNode()?.getText(),
        parameters: this.extractFunctionParams(fn.getParameters()),
        hasFactoryAnnotation: this.nodeHasJsDocTag(fn, 'factory'),
        jsDocScope: this.extractJsDocScopeFromNode(fn),
      });
    }

    // Arrow functions / function expressions in variable statements
    for (const varStmt of sf.getVariableStatements()) {
      if (varStmt.getDeclarationKind() !== VariableDeclarationKind.Const)
        continue;

      const isExported = varStmt.isExported();
      const hasFactory = this.nodeHasJsDocTag(varStmt, 'factory');
      const jsDocScope = this.extractJsDocScopeFromNode(varStmt);

      for (const decl of varStmt.getDeclarations()) {
        const init = decl.getInitializer();
        if (!init) continue;
        if (!Node.isArrowFunction(init) && !Node.isFunctionExpression(init))
          continue;

        const name = decl.getName();
        const fn = init as ArrowFunction | FunctionExpression;

        result.push({
          name,
          filePath: sf.getFilePath(),
          isExported,
          returnType: fn.getReturnTypeNode()?.getText(),
          parameters: this.extractFunctionParams(fn.getParameters()),
          hasFactoryAnnotation: hasFactory,
          jsDocScope,
        });
      }
    }

    return result;
  }

  private extractFunctionParams(params: ParameterDeclaration[]): RawParam[] {
    return params.map((p) => {
      const typeNode = p.getTypeNode();
      let type: string;

      if (typeNode && Node.isTypeLiteral(typeNode)) {
        // Object type: preserve the full { ... } text
        type = typeNode.getText();
      } else {
        const text = typeNode?.getText() ?? '';
        // Handle ReturnType<typeof foo> → foo
        const retTypeMatch = text.match(/ReturnType\s*<\s*typeof\s+(\w+)/);
        if (retTypeMatch?.[1]) {
          type = retTypeMatch[1];
        } else {
          // Handle typeof foo → foo
          const typeofMatch = text.match(/^typeof\s+(\w+)/);
          if (typeofMatch?.[1]) {
            type = typeofMatch[1];
          } else {
            type = text.match(/^(\w+)/)?.[1] ?? text;
          }
        }
      }

      return {
        name: p.getName(),
        type,
        isOptional: p.hasQuestionToken(),
      };
    });
  }

  // ── Values ─────────────────────────────────────────────────────────────────

  private extractValues(sf: SourceFile): RawValueData[] {
    const result: RawValueData[] = [];

    for (const varStmt of sf.getVariableStatements()) {
      if (!varStmt.isExported()) continue;
      if (varStmt.getDeclarationKind() !== VariableDeclarationKind.Const)
        continue;

      const hasValue = this.nodeHasJsDocTag(varStmt, 'value');
      const jsDocScope = this.extractJsDocScopeFromNode(varStmt);

      for (const decl of varStmt.getDeclarations()) {
        const typeNode = decl.getTypeNode();
        const typeText = typeNode?.getText() ?? '';
        const typeAnnotation = typeText.match(/^(\w+)/)?.[1];

        result.push({
          name: decl.getName(),
          filePath: sf.getFilePath(),
          typeAnnotation,
          hasValueAnnotation: hasValue,
          jsDocScope,
        });
      }
    }

    return result;
  }

  // ── Tokens ─────────────────────────────────────────────────────────────────

  private extractTokens(sf: SourceFile): FileTokens {
    return {
      interfaces: this.extractInterfaces(sf),
      typeAliases: this.extractTypeAliases(sf),
      importMappings: this.extractImportMappings(sf),
      externalReExports: this.extractExternalReExports(sf),
      classNames: sf.getClasses().map((c) => c.getName()).filter(Boolean) as string[],
      abstractClassNames: sf
        .getClasses()
        .filter((c) => c.isAbstract())
        .map((c) => c.getName())
        .filter(Boolean) as string[],
    };
  }

  private extractInterfaces(sf: SourceFile): string[] {
    return sf
      .getInterfaces()
      .filter((iface) => iface.getMethods().length > 0)
      .map((iface) => iface.getName());
  }

  private extractTypeAliases(sf: SourceFile): Map<string, string> {
    const result = new Map<string, string>();

    // Import aliases: import { Foo as Bar } from './foo' → Bar → Foo
    for (const decl of sf.getImportDeclarations()) {
      for (const named of decl.getNamedImports()) {
        const alias = named.getAliasNode()?.getText();
        const original = named.getNameNode().getText();
        if (alias) {
          result.set(alias, original);
        }
      }
    }

    // Type alias declarations: export type Foo = ... → Foo → Foo (self-mapped token)
    for (const ta of sf.getTypeAliases()) {
      result.set(ta.getName(), ta.getName());
    }

    return result;
  }

  extractImportMappings(sf: SourceFile): Map<string, string> {
    const result = new Map<string, string>();

    for (const decl of sf.getImportDeclarations()) {
      const path = decl.getModuleSpecifierValue();

      for (const named of decl.getNamedImports()) {
        const alias = named.getAliasNode()?.getText();
        const name = named.getNameNode().getText();
        result.set(alias ?? name, path);
      }

      const defaultImport = decl.getDefaultImport();
      if (defaultImport) {
        result.set(defaultImport.getText(), path);
      }
    }

    return result;
  }

  private extractExternalReExports(sf: SourceFile): string[] {
    const result: string[] = [];

    for (const decl of sf.getExportDeclarations()) {
      const moduleSpecifier = decl.getModuleSpecifierValue();
      if (!moduleSpecifier || moduleSpecifier.startsWith('.')) continue;

      for (const named of decl.getNamedExports()) {
        const alias = named.getAliasNode()?.getText();
        const name = named.getNameNode().getText();
        result.push(alias ?? name);
      }
    }

    return result;
  }

  // ── JSDoc helpers ──────────────────────────────────────────────────────────

  private extractJsDocScopeFromNode(
    node: ClassDeclaration | FunctionDeclaration | VariableStatement | ArrowFunction | FunctionExpression
  ): InjectionScope | undefined {
    if (!('getJsDocs' in node)) return undefined;
    const jsDocable = node as { getJsDocs(): Array<{ getText(): string }> };
    for (const jsDoc of jsDocable.getJsDocs()) {
      const match = jsDoc.getText().match(/@scope\s+(singleton|transient)/);
      if (match) return match[1] as InjectionScope;
    }
    return undefined;
  }

  private nodeHasJsDocTag(
    node: FunctionDeclaration | VariableStatement,
    tag: string
  ): boolean {
    if (!('getJsDocs' in node)) return false;
    const jsDocable = node as { getJsDocs(): Array<{ getText(): string }> };
    return jsDocable
      .getJsDocs()
      .some((jd) => jd.getText().includes(`@${tag}`));
  }

  // ── Context object property extraction (used by FactoryAnalyzer) ───────────

  extractContextObjectProperties(
    param: RawParam
  ): { name: string; type: string }[] {
    if (!param.type.startsWith('{')) return [];

    const properties: { name: string; type: string }[] = [];
    const body = param.type.replace(/^\{/, '').replace(/\}$/, '');
    const pattern = /(\w+)\s*:\s*(\w+)/g;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(body)) !== null) {
      if (m[1] && m[2]) {
        properties.push({ name: m[1], type: m[2] });
      }
    }
    return properties;
  }

  // ── Import mappings from a SourceFile (exposed for TypeDeclarationPrinter) ─

  getImportMappingsForFile(filePath: string): Map<string, string> {
    let sf = this.project.getSourceFile(filePath);
    if (!sf) {
      try {
        sf = this.project.addSourceFileAtPath(filePath);
      } catch {
        return new Map();
      }
    }
    return this.extractImportMappings(sf);
  }
}
