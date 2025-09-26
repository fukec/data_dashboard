document.addEventListener('DOMContentLoaded',()=>{
  const cfg = UserConfig.load();
  window.dashboardConfig = cfg;

  const container = document.getElementById('modulesContainer');
  const loadBtn = document.getElementById('loadData');
  const saveBtn = document.getElementById('saveConfigUI');
  const panel = document.getElementById('configPanel');

  function renderPanel(){
    panel.innerHTML='';
    ModuleRegistry.getAll().forEach(mod=>{
      const chk=cfg.active.includes(mod.id)?'checked':'';
      panel.insertAdjacentHTML('beforeend',`
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="chk_${mod.id}" ${chk}>
          <label class="form-check-label" for="chk_${mod.id}">${mod.title}</label>
        </div>`);
    });
    panel.insertAdjacentHTML('beforeend',`
      <hr>
      <label class="form-label mt-2">URL GAS backendu</label>
      <input type="url" id="inputGasUrl" class="form-control" value="${cfg.gasUrl}">`);
  }
  renderPanel();

  saveBtn.addEventListener('click',()=>{
    cfg.active=ModuleRegistry.getAll()
      .map(m=>m.id)
      .filter(id=>document.getElementById(`chk_${id}`).checked);
    cfg.gasUrl=document.getElementById('inputGasUrl').value.trim();
    UserConfig.save(cfg);
    alert('Uloženo');
  });

  loadBtn.addEventListener('click',async()=>{
    container.innerHTML='';
    if(!cfg.gasUrl) return alert('Nastav URL backendu');
    for(const id of cfg.order.filter(i=>cfg.active.includes(i))){
      const mod=ModuleRegistry.get(id);
      const data=await mod.fetchData();
      container.insertAdjacentHTML('beforeend',mod.render(data,cfg.params[id]||{}));
    }
  });
});
