import { ClassInfo, FactoryInfo, ValueInfo } from '../../domain/types';

export interface ReportParams {
  classes: ClassInfo[];
  factories: FactoryInfo[];
  values: ValueInfo[];
  moduleGroupedClasses?: Map<string, ClassInfo[]>;
  moduleGroupedFactories?: Map<string, FactoryInfo[]>;
  moduleGroupedValues?: Map<string, ValueInfo[]>;
  isModular: boolean;
  projectName?: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'class' | 'factory' | 'instance-factory' | 'value' | 'token';
  tokenStatus: 'local' | 'external' | '';
  lifecycle: string;
  registeredAs: string;
  module: string;
  filePath: string;
  isContextObject: boolean;
  deps: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'provides' | 'depends';
}

interface Registration {
  token: string;
  type: 'class' | 'factory' | 'instance-factory' | 'value';
  impl: string;
  lifecycle: string;
  deps: string[];
  module: string;
  filePath: string;
  isContextObject: boolean;
}

interface ModuleSummary {
  name: string;
  classes: string[];
  factories: string[];
  instanceFactories: string[];
  values: string[];
}

interface ReportData {
  projectName: string;
  generatedAt: string;
  stats: {
    total: number; classes: number; factories: number;
    instanceFactories: number; values: number;
    singletons: number; transients: number;
    modules: number; resolvedTokens: number; externalTokens: number;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
  registrations: Registration[];
  modules: ModuleSummary[];
  isModular: boolean;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class HtmlReportPrinter {
  static print(params: ReportParams): string {
    return this.generateHtml(this.buildData(params));
  }

  private static buildData(p: ReportParams): ReportData {
    const { classes, factories, values, moduleGroupedClasses, moduleGroupedFactories, moduleGroupedValues, isModular } = p;

    const classModule = new Map<string, string>();
    const factoryModule = new Map<string, string>();
    const valueModule = new Map<string, string>();
    if (isModular) {
      moduleGroupedClasses?.forEach((cs, m) => cs.forEach(c => classModule.set(c.name, m)));
      moduleGroupedFactories?.forEach((fs, m) => fs.forEach(f => factoryModule.set(f.name, m)));
      moduleGroupedValues?.forEach((vs, m) => vs.forEach(v => valueModule.set(v.name, m)));
    }

    const instanceFactories = factories.filter(f => !!f.instanceFactoryFor);
    const annotatedFactories = factories.filter(f => !f.instanceFactoryFor);

    // Collect all locally-provided tokens
    const localProviders = new Set<string>();
    classes.forEach(c => localProviders.add(c.interfaceName ?? c.abstractClassName ?? c.name));
    annotatedFactories.forEach(f => localProviders.add(f.token ?? f.name));
    instanceFactories.forEach(f => { if (f.instanceFactoryFor) localProviders.add(f.instanceFactoryFor); });
    values.forEach(v => localProviders.add(v.interfaceName ?? v.token ?? v.name));

    const nodes: GraphNode[] = [];
    const nodeIds = new Set<string>();

    classes.forEach(c => {
      nodes.push({ id: c.name, label: c.name, type: 'class', tokenStatus: '', lifecycle: c.scope, registeredAs: c.interfaceName ?? c.abstractClassName ?? c.name, module: classModule.get(c.name) ?? '', filePath: c.filePath, isContextObject: false, deps: c.dependencies.map(d => d.name) });
      nodeIds.add(c.name);
    });
    annotatedFactories.forEach(f => {
      nodes.push({ id: f.name, label: f.name, type: 'factory', tokenStatus: '', lifecycle: f.scope, registeredAs: f.token ?? f.name, module: factoryModule.get(f.name) ?? '', filePath: f.filePath, isContextObject: f.useContextObject ?? false, deps: f.dependencies.map(d => d.name) });
      nodeIds.add(f.name);
    });
    instanceFactories.forEach(f => {
      nodes.push({ id: f.name, label: f.name, type: 'instance-factory', tokenStatus: '', lifecycle: f.scope, registeredAs: f.instanceFactoryFor ?? f.name, module: factoryModule.get(f.name) ?? '', filePath: f.filePath, isContextObject: f.useContextObject ?? false, deps: f.dependencies.map(d => d.name) });
      nodeIds.add(f.name);
    });
    values.forEach(v => {
      nodes.push({ id: v.name, label: v.name, type: 'value', tokenStatus: '', lifecycle: v.scope, registeredAs: v.interfaceName ?? v.token ?? v.name, module: valueModule.get(v.name) ?? '', filePath: v.filePath, isContextObject: false, deps: [] });
      nodeIds.add(v.name);
    });

    const edges: GraphEdge[] = [];
    const tokenNodes = new Map<string, GraphNode>();

    const ensureToken = (name: string) => {
      if (!tokenNodes.has(name) && !nodeIds.has(name)) {
        tokenNodes.set(name, { id: name, label: name, type: 'token', tokenStatus: localProviders.has(name) ? 'local' : 'external', lifecycle: '', registeredAs: name, module: '', filePath: '', isContextObject: false, deps: [] });
      }
    };

    // provides edges — implementor → token
    classes.forEach(c => {
      const t = c.interfaceName ?? c.abstractClassName;
      if (t) { ensureToken(t); edges.push({ source: c.name, target: t, type: 'provides' }); }
    });
    instanceFactories.forEach(f => {
      if (f.instanceFactoryFor) { ensureToken(f.instanceFactoryFor); edges.push({ source: f.name, target: f.instanceFactoryFor, type: 'provides' }); }
    });
    values.forEach(v => {
      const t = v.interfaceName ?? v.token;
      if (t && t !== v.name) { ensureToken(t); edges.push({ source: v.name, target: t, type: 'provides' }); }
    });

    // depends edges — consumer → token (or directly to self-token class)
    [...classes, ...factories].forEach(entity => {
      entity.dependencies.forEach(dep => {
        if (!nodeIds.has(dep.name)) ensureToken(dep.name);
        edges.push({ source: entity.name, target: dep.name, type: 'depends' });
      });
    });

    tokenNodes.forEach(n => { nodes.push(n); nodeIds.add(n.id); });

    const registrations: Registration[] = [
      ...classes.map(c => ({ token: c.interfaceName ?? c.abstractClassName ?? c.name, type: 'class' as const, impl: c.name, lifecycle: c.scope, deps: c.dependencies.map(d => d.name), module: classModule.get(c.name) ?? '', filePath: c.filePath, isContextObject: false })),
      ...annotatedFactories.map(f => ({ token: f.token ?? f.name, type: 'factory' as const, impl: f.name, lifecycle: f.scope, deps: f.dependencies.map(d => d.name), module: factoryModule.get(f.name) ?? '', filePath: f.filePath, isContextObject: f.useContextObject ?? false })),
      ...instanceFactories.map(f => ({ token: f.instanceFactoryFor ?? f.name, type: 'instance-factory' as const, impl: f.name, lifecycle: f.scope, deps: f.dependencies.map(d => d.name), module: factoryModule.get(f.name) ?? '', filePath: f.filePath, isContextObject: f.useContextObject ?? false })),
      ...values.map(v => ({ token: v.interfaceName ?? v.token ?? v.name, type: 'value' as const, impl: v.name, lifecycle: v.scope, deps: [], module: valueModule.get(v.name) ?? '', filePath: v.filePath, isContextObject: false })),
    ];

    const allModNames = new Set([...(moduleGroupedClasses?.keys() ?? []), ...(moduleGroupedFactories?.keys() ?? []), ...(moduleGroupedValues?.keys() ?? [])]);
    const moduleSummaries: ModuleSummary[] = [];
    allModNames.forEach(name => {
      const mf = moduleGroupedFactories?.get(name) ?? [];
      moduleSummaries.push({ name, classes: (moduleGroupedClasses?.get(name) ?? []).map(c => c.name), factories: mf.filter(f => !f.instanceFactoryFor).map(f => f.name), instanceFactories: mf.filter(f => f.instanceFactoryFor).map(f => f.name), values: (moduleGroupedValues?.get(name) ?? []).map(v => v.name) });
    });

    const allServices = [...classes, ...factories, ...values];
    const singletons = allServices.filter(x => x.scope === 'singleton').length;
    const extTkns = [...tokenNodes.values()].filter(t => t.tokenStatus === 'external').length;
    const resTkns = [...tokenNodes.values()].filter(t => t.tokenStatus === 'local').length;

    return {
      projectName: p.projectName ?? 'IoC Container',
      generatedAt: new Date().toISOString(),
      stats: { total: classes.length + factories.length + values.length, classes: classes.length, factories: annotatedFactories.length, instanceFactories: instanceFactories.length, values: values.length, singletons, transients: allServices.length - singletons, modules: allModNames.size, resolvedTokens: resTkns, externalTokens: extTkns },
      nodes, edges, registrations, modules: moduleSummaries, isModular,
    };
  }

  private static generateHtml(data: ReportData): string {
    const json = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
    const ts = new Date(data.generatedAt).toLocaleString();

    const warningBadge = data.stats.externalTokens > 0
      ? `<span class="badge warn">${data.stats.externalTokens} external token${data.stats.externalTokens > 1 ? 's' : ''}</span>`
      : '';

    const modulesTab = data.isModular ? '<button class="tab" data-tab="modules">Modules</button>' : '';
    const modulesSection = data.isModular ? `<section id="tab-modules" class="tab-content">${this.buildModulesTab(data)}</section>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(data.projectName)} — IoC Report</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <div class="h-inner">
    <div class="h-brand">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="14" stroke="#388bfd" stroke-width="1.5"/><circle cx="15" cy="15" r="5" fill="#388bfd"/><line x1="15" y1="1" x2="15" y2="6" stroke="#388bfd" stroke-width="1.5"/><line x1="15" y1="24" x2="15" y2="29" stroke="#388bfd" stroke-width="1.5"/><line x1="1" y1="15" x2="6" y2="15" stroke="#388bfd" stroke-width="1.5"/><line x1="24" y1="15" x2="29" y2="15" stroke="#388bfd" stroke-width="1.5"/><line x1="4.4" y1="4.4" x2="7.9" y2="7.9" stroke="#388bfd" stroke-width="1.5"/><line x1="22.1" y1="22.1" x2="25.6" y2="25.6" stroke="#388bfd" stroke-width="1.5"/><line x1="25.6" y1="4.4" x2="22.1" y2="7.9" stroke="#388bfd" stroke-width="1.5"/><line x1="7.9" y1="22.1" x2="4.4" y2="25.6" stroke="#388bfd" stroke-width="1.5"/></svg>
      <div>
        <h1>${esc(data.projectName)}</h1>
        <span class="h-sub">IoC Container Report &mdash; ioc-arise</span>
      </div>
    </div>
    <div class="h-badges">
      <span class="badge">${esc(ts)}</span>
      <span class="badge blue">${data.stats.total} services</span>
      ${data.isModular ? `<span class="badge purple">${data.stats.modules} modules</span>` : ''}
      ${warningBadge}
    </div>
  </div>
</header>
<nav class="tabs">
  <button class="tab active" data-tab="overview">Overview</button>
  <button class="tab" data-tab="graph">Dependency Graph</button>
  <button class="tab" data-tab="registrations">Registrations</button>
  ${modulesTab}
</nav>
<main>
<section id="tab-overview" class="tab-content active">${this.buildOverview(data)}</section>
<section id="tab-graph" class="tab-content">${this.buildGraph()}</section>
<section id="tab-registrations" class="tab-content">${this.buildRegistrations(data)}</section>
${modulesSection}
</main>
<script>var __R__=${json};
${APP_JS}
</script>
</body>
</html>`;
  }

  private static buildOverview(d: ReportData): string {
    const pct = (n: number) => d.stats.total > 0 ? Math.round(n / d.stats.total * 100) : 0;
    const extWarn = d.stats.externalTokens > 0
      ? `<div class="health-item warn"><span class="hi-icon">⚠</span><div><strong>${d.stats.externalTokens} external token${d.stats.externalTokens > 1 ? 's' : ''}</strong> — these are interface dependencies with no local provider. Register them separately.</div></div>`
      : '<div class="health-item ok"><span class="hi-icon">✓</span><div><strong>All tokens resolved</strong> — every dependency has a registered provider.</div></div>';
    const ifactNote = d.stats.instanceFactories > 0
      ? `<div class="health-item info"><span class="hi-icon">ℹ</span><div><strong>${d.stats.instanceFactories} instance factor${d.stats.instanceFactories > 1 ? 'ies' : 'y'}</strong> — functions auto-detected by return type (no @factory annotation needed).</div></div>`
      : '';

    return `
<div class="cards">
  <div class="card"><div class="card-val">${d.stats.total}</div><div class="card-lbl">Total Services</div></div>
  <div class="card blue"><div class="card-val">${d.stats.classes}</div><div class="card-lbl">Classes <span class="card-sub">useClass</span></div></div>
  <div class="card orange"><div class="card-val">${d.stats.factories}</div><div class="card-lbl">@factory <span class="card-sub">useFactory</span></div></div>
  <div class="card amber"><div class="card-val">${d.stats.instanceFactories}</div><div class="card-lbl">Instance Factories <span class="card-sub">by return type</span></div></div>
  <div class="card green"><div class="card-val">${d.stats.values}</div><div class="card-lbl">Values <span class="card-sub">useValue</span></div></div>
  <div class="card"><div class="card-val">${d.stats.singletons}</div><div class="card-lbl">Singletons</div></div>
  <div class="card dim"><div class="card-val">${d.stats.transients}</div><div class="card-lbl">Transients</div></div>
  ${d.isModular ? `<div class="card purple"><div class="card-val">${d.stats.modules}</div><div class="card-lbl">Modules</div></div>` : ''}
</div>

<div class="section-title">Lifecycle Distribution</div>
<div class="lc-bar-wrap">
  <div class="lc-bar-track"><div class="lc-bar-fill" style="width:${pct(d.stats.singletons)}%"></div></div>
  <div class="lc-legend">
    <span><span class="dot blue"></span>Singleton (${d.stats.singletons})</span>
    <span><span class="dot gray"></span>Transient (${d.stats.transients})</span>
  </div>
</div>

<div class="section-title">Node Types in Dependency Graph</div>
<div class="legend-grid">
  <div class="legend-item"><svg width="20" height="20"><circle cx="10" cy="10" r="9" fill="#58a6ff"/></svg><div><strong>Class</strong> — registered with <code>useClass</code>; implements an interface or abstract class</div></div>
  <div class="legend-item"><svg width="20" height="20"><rect x="2" y="2" width="16" height="16" rx="3" fill="#d29922"/></svg><div><strong>@factory</strong> — <code>useFactory</code>; annotated with <code>@factory</code> JSDoc, token = function name</div></div>
  <div class="legend-item"><svg width="20" height="20"><rect x="2" y="2" width="16" height="16" rx="3" fill="#f59e0b"/></svg><div><strong>Instance factory</strong> — <code>useFactory</code>; detected by explicit return type; token = the interface it returns</div></div>
  <div class="legend-item"><svg width="20" height="20"><polygon points="10,1 19,5.5 19,14.5 10,19 1,14.5 1,5.5" fill="#3fb950"/></svg><div><strong>Value</strong> — registered with <code>useValue</code>; annotated with <code>@value</code> JSDoc</div></div>
  <div class="legend-item"><svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="4 2"/></svg><div><strong>Interface token (local)</strong> — the string key in <code>container.register(token, …)</code>; provided locally</div></div>
  <div class="legend-item"><svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="#f87171" stroke-width="1.5" stroke-dasharray="4 2"/></svg><div><strong>Interface token (external)</strong> — interface from an npm package or another container; must be registered elsewhere</div></div>
</div>

<div class="section-title">Edge Types</div>
<div class="legend-grid">
  <div class="legend-item"><svg width="60" height="20"><line x1="4" y1="10" x2="48" y2="10" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="5 3"/><polygon points="56,10 46,6 46,14" fill="#2dd4bf"/></svg><div><strong>provides</strong> — this node is registered under the target token (implements/extends)</div></div>
  <div class="legend-item"><svg width="60" height="20"><line x1="4" y1="10" x2="48" y2="10" stroke="#94a3b8" stroke-width="1.5"/><polygon points="56,10 46,6 46,14" fill="#94a3b8"/></svg><div><strong>depends</strong> — this node requires the target token to be resolved and injected</div></div>
</div>

<div class="section-title">Health</div>
<div class="health-list">
  ${extWarn}
  ${ifactNote}
  <div class="health-item ok"><span class="hi-icon">✓</span><div><strong>No circular dependencies</strong> — container passed cycle detection at generation time.</div></div>
</div>`;
  }

  private static buildGraph(): string {
    return `
<div class="graph-toolbar">
  <div class="graph-hint">Scroll to zoom &nbsp;·&nbsp; Drag background to pan &nbsp;·&nbsp; Drag node to pin &nbsp;·&nbsp; Click node for details</div>
  <button id="graph-reset" class="btn-ghost">Reset view</button>
</div>
<div class="graph-wrap">
  <svg id="graph-svg">
    <defs>
      <marker id="arr-dep" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#475569"/></marker>
      <marker id="arr-prov" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2dd4bf"/></marker>
      <marker id="arr-dep-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#58a6ff"/></marker>
      <marker id="arr-prov-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2dd4bf"/></marker>
    </defs>
    <g id="graph-root">
      <g id="graph-mod-bg"></g>
      <g id="graph-edges"></g>
      <g id="graph-nodes"></g>
    </g>
  </svg>
  <div id="tooltip" class="tooltip hidden"></div>
  <div id="detail-panel" class="detail-panel hidden"></div>
</div>`;
  }

  private static buildRegistrations(d: ReportData): string {
    const rows = d.registrations.map(r => {
      const fp = r.filePath.replace(/.*\/src\//, 'src/').replace(/.*\/examples\/[^/]+\//, '');
      const ctxNote = r.isContextObject ? ' <span class="ctx-badge" title="Context object pattern">ctx</span>' : '';
      return `<tr data-search="${esc([r.token, r.impl, r.type, ...r.deps, r.module, r.lifecycle].join(' ').toLowerCase())}">
  <td><code class="token">${esc(r.token)}</code></td>
  <td><span class="type-badge ${r.type}">${r.type === 'instance-factory' ? 'inst-factory' : r.type}</span>${ctxNote}</td>
  <td><code>${esc(r.impl)}</code></td>
  <td><span class="lc-badge ${r.lifecycle}">${r.lifecycle}</span></td>
  <td class="deps-cell">${r.deps.length ? r.deps.map(d2 => `<code class="dep">${esc(d2)}</code>`).join('') : '<span class="none">—</span>'}</td>
  ${d.isModular ? `<td>${r.module ? `<span class="mod-badge">${esc(r.module)}</span>` : '<span class="none">—</span>'}</td>` : ''}
  <td class="fp-cell" title="${esc(r.filePath)}"><code class="fp">${esc(fp)}</code></td>
</tr>`;
    }).join('');

    return `
<div class="tbl-toolbar">
  <input id="reg-search" class="search-box" type="text" placeholder="Search token, implementation, dependency…"/>
  <div class="filter-btns">
    <button class="filt active" data-filter="all">All</button>
    <button class="filt" data-filter="class">Classes</button>
    <button class="filt" data-filter="factory">@factory</button>
    <button class="filt" data-filter="instance-factory">Inst-factory</button>
    <button class="filt" data-filter="value">Values</button>
  </div>
  <div id="reg-count" class="tbl-count">${d.registrations.length} registrations</div>
</div>
<div class="tbl-wrap">
  <table id="reg-table">
    <thead><tr>
      <th>Token</th><th>Type</th><th>Implementation</th><th>Lifecycle</th><th>Dependencies</th>
      ${d.isModular ? '<th>Module</th>' : ''}
      <th>File</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
  }

  private static buildModulesTab(d: ReportData): string {
    return `<div class="mod-grid">${d.modules.map(m => `
<div class="mod-card">
  <div class="mod-card-header">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="#bc8cff" stroke-width="1.5"/></svg>
    ${esc(m.name)}
    <span class="mod-count">${m.classes.length + m.factories.length + m.instanceFactories.length + m.values.length}</span>
  </div>
  <div class="mod-card-body">
    ${m.classes.map(c => `<div class="mod-item"><span class="ni class"></span><code>${esc(c)}</code><span class="mi-badge">useClass</span></div>`).join('')}
    ${m.factories.map(f => `<div class="mod-item"><span class="ni factory"></span><code>${esc(f)}</code><span class="mi-badge">@factory</span></div>`).join('')}
    ${m.instanceFactories.map(f => `<div class="mod-item"><span class="ni inst-factory"></span><code>${esc(f)}</code><span class="mi-badge">inst-factory</span></div>`).join('')}
    ${m.values.map(v => `<div class="mod-item"><span class="ni value"></span><code>${esc(v)}</code><span class="mi-badge">useValue</span></div>`).join('')}
  </div>
</div>`).join('')}</div>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px;-webkit-font-smoothing:antialiased}
body{background:#0d1117;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
code{font-family:'Cascadia Code','Fira Code',Consolas,monospace;font-size:.85em}

header{background:#161b22;border-bottom:1px solid #30363d;padding:14px 24px}
.h-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;max-width:1400px;margin:0 auto}
.h-brand{display:flex;align-items:center;gap:12px}
.h-brand h1{font-size:1.15rem;font-weight:600}
.h-sub{font-size:.75rem;color:#8b949e;display:block;margin-top:2px}
.h-badges{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.badge{background:#21262d;border:1px solid #30363d;border-radius:20px;padding:3px 11px;font-size:.72rem;color:#8b949e}
.badge.blue{border-color:#388bfd44;color:#58a6ff;background:#388bfd18}
.badge.purple{border-color:#bc8cff44;color:#bc8cff;background:#bc8cff18}
.badge.warn{border-color:#f9731644;color:#fb923c;background:#f9731618}

.tabs{background:#161b22;border-bottom:1px solid #30363d;padding:0 24px;display:flex}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:#8b949e;cursor:pointer;font-size:.875rem;padding:11px 15px;transition:color .15s,border-color .15s}
.tab:hover{color:#e6edf3}
.tab.active{color:#e6edf3;border-bottom-color:#388bfd}

main{max-width:1400px;margin:0 auto;padding:24px}
.tab-content{display:none}.tab-content.active{display:block}

.cards{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:26px}
.card{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:18px 22px;min-width:110px;flex:1}
.card.blue .card-val{color:#58a6ff}
.card.orange .card-val{color:#d29922}
.card.amber .card-val{color:#f59e0b}
.card.green .card-val{color:#3fb950}
.card.purple .card-val{color:#bc8cff}
.card.dim .card-val{color:#8b949e}
.card-val{font-size:2rem;font-weight:700;line-height:1}
.card-lbl{font-size:.78rem;color:#8b949e;margin-top:5px}
.card-sub{font-size:.7rem;color:#484f58}

.section-title{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#8b949e;margin-bottom:11px;margin-top:28px}
.lc-bar-wrap{margin-bottom:4px}
.lc-bar-track{background:#21262d;border-radius:4px;height:7px;overflow:hidden;margin-bottom:9px}
.lc-bar-fill{background:linear-gradient(90deg,#388bfd,#58a6ff);height:100%;border-radius:4px}
.lc-legend{display:flex;gap:16px;font-size:.8rem;color:#8b949e}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle}
.dot.blue{background:#388bfd}.dot.gray{background:#484f58}

.legend-grid{display:flex;flex-direction:column;gap:8px;margin-bottom:4px}
.legend-item{display:flex;align-items:center;gap:12px;font-size:.85rem;color:#c9d1d9}
.legend-item svg{flex-shrink:0}

.health-list{display:flex;flex-direction:column;gap:8px}
.health-item{display:flex;align-items:flex-start;gap:10px;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px 14px;font-size:.85rem;color:#c9d1d9}
.health-item.ok{border-color:#3fb95030}.health-item.warn{border-color:#f9731630}.health-item.info{border-color:#388bfd30}
.hi-icon{font-size:1rem;line-height:1;margin-top:1px;flex-shrink:0}
.health-item.ok .hi-icon{color:#3fb950}.health-item.warn .hi-icon{color:#fb923c}.health-item.info .hi-icon{color:#58a6ff}

.graph-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap}
.graph-hint{font-size:.75rem;color:#484f58;margin-right:auto}
.btn-ghost{background:none;border:1px solid #30363d;border-radius:6px;color:#8b949e;cursor:pointer;font-size:.78rem;padding:5px 11px}
.btn-ghost:hover{border-color:#58a6ff;color:#58a6ff}
.graph-wrap{position:relative;background:#161b22;border:1px solid #30363d;border-radius:10px;height:600px;overflow:hidden}
#graph-svg{width:100%;height:100%;cursor:grab;display:block}
#graph-svg:active{cursor:grabbing}

.tooltip{position:absolute;background:#1c2128;border:1px solid #30363d;border-radius:8px;padding:10px 13px;font-size:.8rem;pointer-events:none;z-index:10;max-width:280px;box-shadow:0 8px 24px #0009}
.tooltip.hidden{display:none}
.tt-title{font-weight:600;font-size:.9rem;margin-bottom:6px;word-break:break-all}
.tt-row{color:#8b949e;margin-top:3px}.tt-row strong{color:#c9d1d9}
.tt-ext{color:#fb923c;font-size:.78rem;margin-top:5px}

.detail-panel{position:absolute;right:12px;top:12px;background:#1c2128;border:1px solid #30363d;border-radius:10px;padding:14px 16px;width:230px;font-size:.8rem;box-shadow:0 8px 24px #0009;z-index:11;max-height:calc(100% - 24px);overflow-y:auto}
.detail-panel.hidden{display:none}
.dp-close{float:right;background:none;border:none;color:#8b949e;cursor:pointer;font-size:1rem;line-height:1;padding:0;margin-left:8px}
.dp-name{font-weight:700;font-size:.95rem;margin-bottom:10px;word-break:break-all}
.dp-row{margin-top:4px;color:#8b949e}.dp-row strong{color:#c9d1d9}
.dp-section{margin-top:10px;padding-top:8px;border-top:1px solid #21262d;font-weight:600;color:#8b949e;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}
.dp-dep{display:block;font-size:.78rem;padding:3px 0;border-top:1px solid #21262d40;color:#8b949e}
.dp-dep:first-child{border-top:none}
.dp-code{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#79c0ff;font-size:.75rem;padding:7px 9px;margin-top:8px;white-space:pre-wrap;word-break:break-all;font-family:Consolas,monospace}

.tbl-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.search-box{background:#161b22;border:1px solid #30363d;border-radius:8px;color:#e6edf3;flex:1;font-size:.875rem;max-width:380px;outline:none;padding:7px 13px;transition:border-color .15s}
.search-box:focus{border-color:#388bfd}
.search-box::placeholder{color:#484f58}
.filter-btns{display:flex;gap:5px;flex-wrap:wrap}
.filt{background:none;border:1px solid #30363d;border-radius:20px;color:#8b949e;cursor:pointer;font-size:.75rem;padding:4px 11px;transition:all .15s}
.filt:hover{border-color:#8b949e;color:#e6edf3}
.filt.active{background:#388bfd18;border-color:#388bfd44;color:#58a6ff}
.tbl-count{font-size:.8rem;color:#8b949e;margin-left:auto;white-space:nowrap}
.tbl-wrap{overflow-x:auto;border-radius:10px;border:1px solid #30363d}
table{border-collapse:collapse;width:100%;min-width:700px}
thead{background:#161b22;border-bottom:1px solid #30363d}
th{color:#8b949e;font-size:.75rem;font-weight:600;letter-spacing:.05em;padding:9px 13px;text-align:left;text-transform:uppercase}
td{border-top:1px solid #21262d;padding:9px 13px;vertical-align:top;font-size:.84rem}
tr:hover td{background:#161b22}
tr.hidden{display:none}
.token{color:#79c0ff;background:#1c2128;padding:2px 6px;border-radius:4px}
.dep{color:#8b949e;background:#21262d;padding:1px 5px;border-radius:4px;margin:1px 2px;display:inline-block}
.none{color:#484f58;font-style:italic}
.deps-cell,.fp-cell{max-width:220px}
.fp{color:#6e7681;font-size:.78em}
.type-badge{border-radius:12px;font-size:.72rem;padding:2px 9px;font-weight:600;white-space:nowrap}
.type-badge.class{background:#388bfd18;color:#58a6ff;border:1px solid #388bfd33}
.type-badge.factory{background:#d2992218;color:#d29922;border:1px solid #d2992233}
.type-badge.instance-factory{background:#f59e0b18;color:#f59e0b;border:1px solid #f59e0b33}
.type-badge.value{background:#3fb95018;color:#3fb950;border:1px solid #3fb95033}
.lc-badge{border-radius:12px;font-size:.72rem;padding:2px 9px;white-space:nowrap}
.lc-badge.singleton{background:#58a6ff18;color:#58a6ff}
.lc-badge.transient{background:#48505840;color:#8b949e}
.mod-badge{background:#bc8cff18;border:1px solid #bc8cff33;border-radius:12px;color:#bc8cff;font-size:.72rem;padding:2px 7px;white-space:nowrap}
.ctx-badge{background:#2dd4bf18;border:1px solid #2dd4bf33;border-radius:10px;color:#2dd4bf;font-size:.7rem;padding:1px 6px;margin-left:4px}

.mod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.mod-card{background:#161b22;border:1px solid #30363d;border-radius:10px;overflow:hidden}
.mod-card-header{align-items:center;background:#1c2128;border-bottom:1px solid #30363d;color:#bc8cff;display:flex;font-size:.875rem;font-weight:600;gap:8px;padding:11px 15px}
.mod-count{background:#bc8cff18;border:1px solid #bc8cff33;border-radius:20px;color:#8b949e;font-size:.72rem;font-weight:400;margin-left:auto;padding:1px 8px}
.mod-card-body{padding:8px 14px}
.mod-item{align-items:center;display:flex;font-size:.82rem;gap:8px;padding:5px 0;border-bottom:1px solid #21262d;color:#c9d1d9}
.mod-item:last-child{border-bottom:none}
.ni{display:inline-block;width:10px;height:10px;border-radius:50%;flex-shrink:0}
.ni.class{background:#58a6ff}.ni.factory{background:#d29922}.ni.inst-factory{background:#f59e0b}.ni.value{background:#3fb950}
.mi-badge{margin-left:auto;font-size:.7rem;color:#484f58}
`;

// ─────────────────────────────────────────────────────────────────────────────
// JavaScript
// ─────────────────────────────────────────────────────────────────────────────

const APP_JS = `(function(){

// ── Tab switching ─────────────────────────────────────────────────────────────
var tabs=Array.from(document.querySelectorAll('.tab'));
var secs=Array.from(document.querySelectorAll('.tab-content'));
function switchTab(tabName){
  tabs.forEach(function(t){t.classList.remove('active');});
  secs.forEach(function(s){s.classList.remove('active');});
  var btn=tabs.find(function(t){return t.getAttribute('data-tab')===tabName;});
  if(btn)btn.classList.add('active');
  var sec=document.getElementById('tab-'+tabName);
  if(sec)sec.classList.add('active');
  if(tabName==='graph')initGraph();
}
tabs.forEach(function(btn){
  btn.addEventListener('click',function(){switchTab(btn.getAttribute('data-tab'));});
});

// ── Registration filter + search ──────────────────────────────────────────────
var searchBox=document.getElementById('reg-search');
var regCount=document.getElementById('reg-count');
var rows=Array.from(document.querySelectorAll('#reg-table tbody tr'));
var activeFilter='all';

function applyFilter(){
  var q=(searchBox?searchBox.value.toLowerCase().trim():'');
  var vis=0;
  rows.forEach(function(row){
    var ds=row.getAttribute('data-search')||'';
    var typeMatch=activeFilter==='all'||ds.includes(activeFilter);
    var textMatch=!q||ds.includes(q);
    var show=typeMatch&&textMatch;
    row.classList.toggle('hidden',!show);
    if(show)vis++;
  });
  if(regCount)regCount.textContent=vis+' registrations';
}

if(searchBox)searchBox.addEventListener('input',applyFilter);
Array.from(document.querySelectorAll('.filt')).forEach(function(btn){
  btn.addEventListener('click',function(){
    Array.from(document.querySelectorAll('.filt')).forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    activeFilter=btn.getAttribute('data-filter')||'all';
    applyFilter();
  });
});

// ── Graph ─────────────────────────────────────────────────────────────────────
var graphInited=false;
function initGraph(){
  if(graphInited)return;
  graphInited=true;

  var data=__R__;
  if(!data.nodes||data.nodes.length===0)return;

  var svg=document.getElementById('graph-svg');
  var root=document.getElementById('graph-root');
  var edgesG=document.getElementById('graph-edges');
  var nodesG=document.getElementById('graph-nodes');
  var modBgG=document.getElementById('graph-mod-bg');
  var tooltip=document.getElementById('tooltip');
  var detailPanel=document.getElementById('detail-panel');

  var W=svg.clientWidth||1000;
  var H=svg.clientHeight||600;

  // Node type config
  var TYPE_CFG={
    'class':         {fill:'#58a6ff',r:26,stroke:'none'},
    'factory':       {fill:'#d29922',r:24,stroke:'none'},
    'instance-factory':{fill:'#f59e0b',r:24,stroke:'none'},
    'value':         {fill:'#3fb950',r:22,stroke:'none'},
    'token':         {fill:'transparent',r:18,stroke:'auto'}
  };
  var TOKEN_STROKE={'local':'#58a6ff','external':'#f87171',''  :'#64748b'};

  // Module colors
  var MOD_PALETTE=['#7c3aed','#db2777','#ea580c','#16a34a','#2563eb','#0891b2','#65a30d','#b45309'];
  var modColorMap={};
  var modIdx=0;
  data.nodes.forEach(function(n){
    if(n.module&&!modColorMap[n.module]){
      modColorMap[n.module]=MOD_PALETTE[modIdx%MOD_PALETTE.length];
      modIdx++;
    }
  });

  // Build inbound map (who depends on / provides each node)
  var inboundDep={};   // node id -> list of ids that depend on it
  var inboundProv={};  // token id -> provider id
  data.edges.forEach(function(e){
    if(e.type==='depends'){
      if(!inboundDep[e.target])inboundDep[e.target]=[];
      inboundDep[e.target].push(e.source);
    } else {
      inboundProv[e.target]=e.source;
    }
  });

  // Init positions
  var nodes=data.nodes.map(function(n,i){
    var angle=(i/data.nodes.length)*2*Math.PI;
    var radius=Math.min(W,H)*0.32;
    var cfg=TYPE_CFG[n.type]||TYPE_CFG.class;
    return Object.assign({},n,{
      x:W/2+Math.cos(angle)*radius+(Math.random()-0.5)*40,
      y:H/2+Math.sin(angle)*radius+(Math.random()-0.5)*40,
      vx:0,vy:0,r:cfg.r,fixed:false
    });
  });
  var nodeById={};
  nodes.forEach(function(n){nodeById[n.id]=n;});

  var edges=data.edges.map(function(e){
    return{s:nodeById[e.source],t:nodeById[e.target],type:e.type};
  }).filter(function(e){return e.s&&e.t;});

  // ── Create SVG elements ───────────────────────────────────────────────────

  // Edges
  var edgeEls=edges.map(function(e){
    var line=document.createElementNS('http://www.w3.org/2000/svg','line');
    var isP=e.type==='provides';
    line.setAttribute('stroke',isP?'#2dd4bf':'#334155');
    line.setAttribute('stroke-width',isP?'1.5':'1.5');
    if(isP)line.setAttribute('stroke-dasharray','6 3');
    line.setAttribute('marker-end',isP?'url(#arr-prov)':'url(#arr-dep)');
    line.setAttribute('opacity','0.7');
    edgesG.appendChild(line);
    return{el:line,edge:e};
  });

  // Nodes
  var selectedNode=null;
  var draggingNode=null;
  var dragOX=0,dragOY=0;

  var nodeEls=nodes.map(function(n){
    var cfg=TYPE_CFG[n.type]||TYPE_CFG.class;
    var g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.style.cursor='pointer';

    // shape
    var shape;
    if(n.type==='factory'||n.type==='instance-factory'){
      // rounded rect
      shape=document.createElementNS('http://www.w3.org/2000/svg','rect');
      var sz=n.r*1.6;
      shape.setAttribute('x',-sz/2);shape.setAttribute('y',-sz/2);
      shape.setAttribute('width',sz);shape.setAttribute('height',sz);
      shape.setAttribute('rx','5');
    } else if(n.type==='value'){
      // hexagon
      shape=document.createElementNS('http://www.w3.org/2000/svg','polygon');
      var r=n.r;
      var pts=[];
      for(var k=0;k<6;k++){var a=Math.PI/6+k*Math.PI/3;pts.push((r*Math.cos(a)).toFixed(2)+','+(r*Math.sin(a)).toFixed(2));}
      shape.setAttribute('points',pts.join(' '));
    } else {
      shape=document.createElementNS('http://www.w3.org/2000/svg','circle');
      shape.setAttribute('r',n.r);
    }

    // fill & stroke
    if(n.type==='token'){
      var tStroke=TOKEN_STROKE[n.tokenStatus]||'#64748b';
      shape.setAttribute('fill','#161b22');
      shape.setAttribute('stroke',tStroke);
      shape.setAttribute('stroke-width','1.5');
      shape.setAttribute('stroke-dasharray','5 3');
    } else {
      shape.setAttribute('fill',cfg.fill);
      shape.setAttribute('stroke','none');
    }

    // lifecycle: transient gets inner dashed ring
    var lifetimeEl=null;
    if(n.lifecycle==='transient'&&n.type!=='token'){
      lifetimeEl=document.createElementNS('http://www.w3.org/2000/svg','circle');
      lifetimeEl.setAttribute('r',n.r+4);
      lifetimeEl.setAttribute('fill','none');
      lifetimeEl.setAttribute('stroke','#ffffff30');
      lifetimeEl.setAttribute('stroke-width','1');
      lifetimeEl.setAttribute('stroke-dasharray','3 2');
      g.appendChild(lifetimeEl);
    }

    // module ring
    var modRing=null;
    if(n.module&&modColorMap[n.module]){
      modRing=document.createElementNS('http://www.w3.org/2000/svg','circle');
      modRing.setAttribute('r',n.r+3);
      modRing.setAttribute('fill','none');
      modRing.setAttribute('stroke',modColorMap[n.module]);
      modRing.setAttribute('stroke-width','2.5');
      modRing.setAttribute('opacity','0.6');
      g.insertBefore(modRing,g.firstChild);
    }

    g.appendChild(shape);

    // label inside
    var maxLen=n.type==='token'?11:10;
    var lbl=n.label.length>maxLen?n.label.slice(0,maxLen-1)+'…':n.label;
    var text=document.createElementNS('http://www.w3.org/2000/svg','text');
    text.textContent=lbl;
    text.setAttribute('text-anchor','middle');
    text.setAttribute('dy','0.35em');
    text.setAttribute('font-size',n.type==='token'?'9':'9.5');
    text.setAttribute('fill',n.type==='token'?(n.tokenStatus==='external'?'#f87171':'#94a3b8'):'#fff');
    text.setAttribute('font-weight','600');
    text.setAttribute('pointer-events','none');
    text.setAttribute('font-family','system-ui,sans-serif');
    g.appendChild(text);

    nodesG.appendChild(g);

    g.addEventListener('mouseenter',function(e){showTip(n,e);});
    g.addEventListener('mousemove',function(e){moveTip(e);});
    g.addEventListener('mouseleave',function(){hideTip();});
    g.addEventListener('mousedown',function(e){
      draggingNode=n;n.fixed=true;
      alpha=Math.max(alpha,0.4);
      var pt=toSvg(e.clientX,e.clientY);
      dragOX=pt.x-n.x;dragOY=pt.y-n.y;
      e.stopPropagation();e.preventDefault();
    });
    g.addEventListener('click',function(e){
      selectedNode=(selectedNode===n)?null:n;
      highlight();showDetail(selectedNode);
      e.stopPropagation();
    });

    return{g:g,shape:shape,text:text,node:n};
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  function he(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function showTip(n,e){
    var deps=(n.deps||[]).join(', ')||'—';
    var prov=inboundProv[n.id]?('<strong>Provided by:</strong> '+he(inboundProv[n.id])):'';
    var consumers=(inboundDep[n.id]||[]).length?('<strong>Used by:</strong> '+he((inboundDep[n.id]||[]).join(', '))):'';
    var extNote=n.tokenStatus==='external'?'<div class="tt-ext">⚠ External token — no local provider. Register separately.</div>':'';
    tooltip.innerHTML=
      '<div class="tt-title">'+he(n.label)+'</div>'+
      '<div class="tt-row"><strong>Type:</strong> '+he(n.type)+'</div>'+
      (n.lifecycle?'<div class="tt-row"><strong>Lifecycle:</strong> '+he(n.lifecycle)+'</div>':'')+
      (n.registeredAs&&n.registeredAs!==n.label?'<div class="tt-row"><strong>Token:</strong> '+he(n.registeredAs)+'</div>':'')+
      (n.module?'<div class="tt-row"><strong>Module:</strong> '+he(n.module)+'</div>':'')+
      (n.isContextObject?'<div class="tt-row"><strong>Pattern:</strong> context object</div>':'')+
      (n.type!=='token'&&n.deps&&n.deps.length?'<div class="tt-row"><strong>Depends on:</strong> '+he(deps)+'</div>':'')+
      (prov?'<div class="tt-row">'+prov+'</div>':'')+
      (consumers?'<div class="tt-row">'+consumers+'</div>':'')+
      extNote;
    tooltip.classList.remove('hidden');
    moveTip(e);
  }
  function moveTip(e){
    var rect=svg.getBoundingClientRect();
    var x=e.clientX-rect.left+16,y=e.clientY-rect.top+16;
    if(x+290>rect.width)x=e.clientX-rect.left-290;
    if(y+160>rect.height)y=e.clientY-rect.top-160;
    tooltip.style.left=x+'px';tooltip.style.top=y+'px';
  }
  function hideTip(){tooltip.classList.add('hidden');}

  // ── Detail panel ──────────────────────────────────────────────────────────
  function regCode(n){
    if(n.type==='token')return'// Interface / abstract token\\n// Binding resolved by: '+(inboundProv[n.id]||'(external)');
    var token=n.registeredAs===n.label?n.label:"'"+n.registeredAs+"'";
    var method=n.type==='value'?'useValue':n.type==='class'?'useClass':'useFactory';
    var deps=n.deps&&n.deps.length?'\\n  dependencies: ['+n.deps.map(function(d){return"'"+d+"'";}).join(', ')+'],':'';
    var lc=n.lifecycle==='transient'?'\\n  lifecycle: Lifecycle.Transient':'\\n  lifecycle: Lifecycle.Singleton';
    return'container.register('+token+', {\\n  '+method+': '+he(n.label)+','+deps+lc+'\\n});';
  }
  function showDetail(n){
    if(!n){detailPanel.classList.add('hidden');return;}
    var consumers=inboundDep[n.id]||[];
    var provider=inboundProv[n.id];
    var depsHtml=(n.deps&&n.deps.length)?n.deps.map(function(d){return'<span class="dp-dep">→ '+he(d)+'</span>';}).join(''):'<span class="dp-dep" style="color:#484f58">none</span>';
    var usedHtml=consumers.length?consumers.map(function(c){return'<span class="dp-dep">↑ '+he(c)+'</span>';}).join(''):'<span class="dp-dep" style="color:#484f58">nothing</span>';
    detailPanel.innerHTML=
      '<button class="dp-close" id="dp-x">&#x2715;</button>'+
      '<div class="dp-name">'+he(n.label)+'</div>'+
      '<div class="dp-row"><strong>Type:</strong> '+he(n.type)+'</div>'+
      (n.lifecycle?'<div class="dp-row"><strong>Lifecycle:</strong> '+he(n.lifecycle)+'</div>':'')+
      (n.registeredAs&&n.registeredAs!==n.label?'<div class="dp-row"><strong>Token:</strong> '+he(n.registeredAs)+'</div>':'')+
      (n.module?'<div class="dp-row"><strong>Module:</strong> '+he(n.module)+'</div>':'')+
      (n.isContextObject?'<div class="dp-row"><strong>Pattern:</strong> context object</div>':'')+
      (n.type==='token'&&provider?'<div class="dp-row"><strong>Provided by:</strong> '+he(provider)+'</div>':'')+
      (n.type==='token'&&n.tokenStatus==='external'?'<div class="dp-row" style="color:#fb923c">⚠ External token</div>':'')+
      '<div class="dp-section">Depends on</div>'+depsHtml+
      '<div class="dp-section">Used by</div>'+usedHtml+
      '<div class="dp-code">'+regCode(n)+'</div>';
    detailPanel.classList.remove('hidden');
    document.getElementById('dp-x').addEventListener('click',function(){
      selectedNode=null;highlight();detailPanel.classList.add('hidden');
    });
  }

  // ── Highlight ─────────────────────────────────────────────────────────────
  function highlight(){
    if(!selectedNode){
      nodeEls.forEach(function(el){el.shape.setAttribute('opacity','1');});
      edgeEls.forEach(function(el){
        var isP=el.edge.type==='provides';
        el.el.setAttribute('stroke',isP?'#2dd4bf':'#334155');
        el.el.setAttribute('opacity','0.7');
        el.el.setAttribute('marker-end',isP?'url(#arr-prov)':'url(#arr-dep)');
      });
      return;
    }
    var connected=new Set([selectedNode.id]);
    edges.forEach(function(e){
      if(e.s===selectedNode)connected.add(e.t.id);
      if(e.t===selectedNode)connected.add(e.s.id);
    });
    nodeEls.forEach(function(el){el.shape.setAttribute('opacity',connected.has(el.node.id)?'1':'0.12');});
    edgeEls.forEach(function(el){
      var active=el.edge.s===selectedNode||el.edge.t===selectedNode;
      var isP=el.edge.type==='provides';
      el.el.setAttribute('stroke',active?(isP?'#2dd4bf':'#58a6ff'):'#21262d');
      el.el.setAttribute('opacity',active?'1':'0.15');
      el.el.setAttribute('stroke-width',active?'2':'1.5');
      el.el.setAttribute('marker-end',active?(isP?'url(#arr-prov-hi)':'url(#arr-dep-hi)'):(isP?'url(#arr-prov)':'url(#arr-dep)'));
    });
  }

  // ── Force simulation ──────────────────────────────────────────────────────
  var alpha=1.0;
  function tick(){
    if(alpha<0.002)return;
    alpha*=0.97;
    // Repulsion
    for(var i=0;i<nodes.length;i++){
      for(var j=i+1;j<nodes.length;j++){
        var a=nodes[i],b=nodes[j];
        var dx=b.x-a.x||0.01,dy=b.y-a.y||0.01;
        var d2=Math.max(dx*dx+dy*dy,64);
        var d=Math.sqrt(d2);
        var f=11000/d2;
        var fx=f*dx/d,fy=f*dy/d;
        if(!a.fixed){a.vx-=fx;a.vy-=fy;}
        if(!b.fixed){b.vx+=fx;b.vy+=fy;}
      }
    }
    // Spring edges — provides edges shorter (tighter cluster)
    edges.forEach(function(e){
      var dx=e.t.x-e.s.x,dy=e.t.y-e.s.y;
      var d=Math.sqrt(dx*dx+dy*dy)||1;
      var ideal=e.type==='provides'?90:150;
      var f=(d-ideal)*0.04;
      var fx=f*dx/d,fy=f*dy/d;
      if(!e.s.fixed){e.s.vx+=fx;e.s.vy+=fy;}
      if(!e.t.fixed){e.t.vx-=fx;e.t.vy-=fy;}
    });
    // Center gravity
    nodes.forEach(function(n){
      if(n.fixed)return;
      n.vx+=(W/2-n.x)*0.012;n.vy+=(H/2-n.y)*0.012;
      n.x+=n.vx;n.y+=n.vy;n.vx*=0.65;n.vy*=0.65;
    });
  }

  function render(){
    edgeEls.forEach(function(el){
      var s=el.edge.s,t=el.edge.t;
      var dx=t.x-s.x,dy=t.y-s.y;
      var d=Math.sqrt(dx*dx+dy*dy)||1;
      var offset=t.r+4;
      el.el.setAttribute('x1',s.x);el.el.setAttribute('y1',s.y);
      el.el.setAttribute('x2',(t.x-offset*dx/d).toFixed(1));el.el.setAttribute('y2',(t.y-offset*dy/d).toFixed(1));
    });
    nodeEls.forEach(function(el){
      el.g.setAttribute('transform','translate('+el.node.x.toFixed(1)+','+el.node.y.toFixed(1)+')');
    });
    // Module background hulls (bounding boxes)
    updateModuleBg();
  }

  function updateModuleBg(){
    while(modBgG.firstChild)modBgG.removeChild(modBgG.firstChild);
    if(!data.isModular)return;
    var groups={};
    nodes.forEach(function(n){
      if(!n.module)return;
      if(!groups[n.module])groups[n.module]={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
      var g=groups[n.module],pad=n.r+14;
      g.minX=Math.min(g.minX,n.x-pad);g.minY=Math.min(g.minY,n.y-pad);
      g.maxX=Math.max(g.maxX,n.x+pad);g.maxY=Math.max(g.maxY,n.y+pad);
    });
    Object.keys(groups).forEach(function(mod){
      var g=groups[mod],col=modColorMap[mod]||'#8b949e';
      var rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x',g.minX);rect.setAttribute('y',g.minY);
      rect.setAttribute('width',g.maxX-g.minX);rect.setAttribute('height',g.maxY-g.minY);
      rect.setAttribute('rx','12');rect.setAttribute('fill',col);rect.setAttribute('fill-opacity','0.05');
      rect.setAttribute('stroke',col);rect.setAttribute('stroke-width','1');rect.setAttribute('stroke-opacity','0.25');
      var label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.textContent=mod;
      label.setAttribute('x',g.minX+10);label.setAttribute('y',g.minY+16);
      label.setAttribute('fill',col);label.setAttribute('font-size','10');label.setAttribute('font-weight','600');
      label.setAttribute('opacity','0.7');label.setAttribute('font-family','system-ui,sans-serif');
      label.setAttribute('pointer-events','none');
      modBgG.appendChild(rect);modBgG.appendChild(label);
    });
  }

  function frame(){tick();render();requestAnimationFrame(frame);}
  frame();

  // ── Pan & zoom ────────────────────────────────────────────────────────────
  var tx=0,ty=0,sc=1;
  function applyT(){root.setAttribute('transform','translate('+tx+','+ty+') scale('+sc+')');}
  function toSvg(cx,cy){var r=svg.getBoundingClientRect();return{x:(cx-r.left-tx)/sc,y:(cy-r.top-ty)/sc};}

  svg.addEventListener('wheel',function(e){
    e.preventDefault();
    var f=e.deltaY<0?1.12:0.89;
    var r=svg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
    tx=mx-f*(mx-tx);ty=my-f*(my-ty);
    sc=Math.max(0.08,Math.min(8,sc*f));
    applyT();
  },{passive:false});

  var panning=false,psx=0,psy=0;
  svg.addEventListener('mousedown',function(e){
    if(e.target===svg||e.target===root||e.target.tagName==='svg'||e.target===edgesG||e.target===nodesG||e.target===modBgG){
      panning=true;psx=e.clientX-tx;psy=e.clientY-ty;
      selectedNode=null;highlight();detailPanel.classList.add('hidden');
    }
  });
  document.addEventListener('mousemove',function(e){
    if(panning){tx=e.clientX-psx;ty=e.clientY-psy;applyT();}
    if(draggingNode){var pt=toSvg(e.clientX,e.clientY);draggingNode.x=pt.x-dragOX;draggingNode.y=pt.y-dragOY;alpha=Math.max(alpha,0.1);}
  });
  document.addEventListener('mouseup',function(){
    panning=false;
    if(draggingNode){draggingNode.fixed=false;draggingNode=null;}
  });
  document.getElementById('graph-reset').addEventListener('click',function(){tx=0;ty=0;sc=1;applyT();});
}

})();
`;
