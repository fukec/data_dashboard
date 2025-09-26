const ModuleRegistry = {
  modules: {},
  register(module) { this.modules[module.id] = module; },
  getAll() { return Object.values(this.modules); },
  get(id) { return this.modules[id]; }
};

function fetchFromGAS(action) {
  const url = window.dashboardConfig.gasUrl + '?action=' + action;
  return fetch(url)
    .then(res => res.json())
    .then(r => r.data);
}

// Celkové tržby
ModuleRegistry.register({
  id: 'metricRevenue',
  title: 'Celkové tržby',
  defaultConfig: { color: 'primary' },
  configSchema: [{ field:'color',type:'select',options:['primary','success','info','warning','danger'] }],
  fetchData: () => fetchFromGAS('dashboard').then(d=>d.metrics[0]),
  render(data,cfg) {
    return `
      <div class="card metric-card border-0 shadow-sm text-${cfg.color}">
        <div class="card-body">
          <h6 class="text-muted">${this.title}</h6>
          <h3 class="fw-bold">${data.value}</h3>
        </div>
      </div>`;
  }
});

// Aktivní uživatelé
ModuleRegistry.register({
  id: 'metricUsers',
  title: 'Aktivní uživatelé',
  defaultConfig: { color: 'success' },
  configSchema: [{ field:'color',type:'select',options:['primary','success','info','warning','danger'] }],
  fetchData: () => fetchFromGAS('dashboard').then(d=>d.metrics[1]),
  render(data,cfg) {
    return `
      <div class="card metric-card border-0 shadow-sm text-${cfg.color}">
        <div class="card-body">
          <h6 class="text-muted">${this.title}</h6>
          <h3 class="fw-bold">${data.value}</h3>
        </div>
      </div>`;
  }
});

// Měsíční trendy
ModuleRegistry.register({
  id: 'chartMonthly',
  title: 'Měsíční trendy',
  defaultConfig: { type: 'line' },
  configSchema: [{ field:'type',type:'select',options:['line','bar'] }],
  fetchData: () => fetchFromGAS('charts').then(d=>d.monthlyTrends),
  render(data,cfg) {
    const id='chartMonthlyCanvas';
    setTimeout(()=>{
      new Chart(
        document.getElementById(id).getContext('2d'),
        { type: cfg.type, data:{
            labels: data.map(i=>i.month),
            datasets:[{label:'Prodeje',data:data.map(i=>i.sales),borderColor:'#0d6efd',
            backgroundColor: cfg.type==='line'?'rgba(13,110,253,0.1)':undefined}]
        } }
      );
    },0);
    return `
      <div class="card chart-card border-0 shadow-sm">
        <div class="card-body p-2">
          <canvas id="${id}" height="150"></canvas>
        </div>
      </div>`;
  }
});

// Tabulka zaměstnanců
ModuleRegistry.register({
  id: 'tableEmployees',
  title: 'Zaměstnanci',
  defaultConfig: { itemsPerPage: 10 },
  configSchema: [{ field:'itemsPerPage',type:'number',min:1,max:50 }],
  fetchData: () => fetchFromGAS('tables').then(d=>d.employees),
  render(data,cfg) {
    const rows=data.slice(0,cfg.itemsPerPage).map(e=>`
      <tr>
        <td>${e.id}</td><td>${e.name}</td><td>${e.department}</td>
        <td>${e.position}</td><td>${e.salary}</td><td>${e.performance}%</td>
      </tr>`).join('');
    return `
      <div class="card table-card border-0 shadow-sm">
        <div class="card-body p-0">
          <table class="table mb-0">
            <thead class="table-light">
              <tr><th>ID</th><th>Jméno</th><th>Oddělení</th><th>Pozice</th><th>Plat</th><th>Výkonnost</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }
});
