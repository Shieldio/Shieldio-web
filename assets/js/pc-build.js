(()=>{
  const data=window.PC_BUILD_DATA;
  if(!data)return;
  const money=value=>new Intl.NumberFormat('cs-CZ').format(value)+' Kč';
  const sum=items=>items.reduce((total,item)=>total+item.price,0);
  const total=sum(data.pc);
  const remaining=data.limit-total;
  const budget=document.querySelector('#budgetCards');
  const map=document.querySelector('#componentMap');
  const detail=document.querySelector('#componentDetail');

  budget.innerHTML=`<article class="pc-budget-card pc-budget-card--single"><p class="learn-eyebrow">TVŮJ WINDOWS SETUP · VČETNĚ ZVUKU</p><div class="pc-budget-amount"><b>${money(total)}</b><span>z limitu ${money(data.limit)}</span></div><p class="pc-budget-reserve"><strong>${money(remaining)}</strong> zůstává jako rezerva.</p><div class="pc-budget-list">${data.pc.map(item=>`<div><span>${item.category}</span><b>${money(item.price)}</b></div>`).join('')}</div></article>`;

  function renderDetail(item){
    detail.innerHTML=`<p class="learn-eyebrow">${item.category}</p><h3>${item.name}</h3><strong class="pc-detail-price">${money(item.price)}</strong>${item.priceStatus?`<p class="pc-price-status">${item.priceStatus}</p>`:''}<p>${item.description}</p><ul>${item.specs.map(spec=>`<li>${spec}</li>`).join('')}</ul><dl><dt>Napájení / výkon</dt><dd>${item.power||'—'}</dd><dt>Proč pasuje</dt><dd>${item.upgradeInfo}</dd></dl><a class="learn-button" href="${item.alzaUrl}" target="_blank" rel="noopener">Otevřít detail na Alze ↗</a>`;
  }

  map.innerHTML=data.pc.map((item,index)=>`<button class="pc-part ${index===0?'is-active':''}" data-id="${item.id}"><span>${String(index+1).padStart(2,'0')}</span><b>${item.category}</b><small>${item.name}</small><strong>${money(item.price)}</strong></button>`).join('');
  renderDetail(data.pc[0]);
  map.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    map.querySelectorAll('button').forEach(item=>item.classList.toggle('is-active',item===button));
    renderDetail(data.pc.find(item=>item.id===button.dataset.id));
  });

  const macTabs=document.querySelector('#macTabs');
  const macDetail=document.querySelector('#macDetail');
  function renderMac(item){
    macDetail.innerHTML=`<p class="learn-eyebrow">${item.category}</p><h3>${item.name}</h3><p>${item.description}</p><ul>${item.specs.map(spec=>`<li>${spec}</li>`).join('')}</ul><dl><dt>Rozšíření</dt><dd>${item.upgradeInfo}</dd></dl>`;
  }
  macTabs.innerHTML=data.mac.map((item,index)=>`<button class="${index?'':'is-active'}" data-id="${item.id}">${item.category}</button>`).join('');
  renderMac(data.mac[0]);
  macTabs.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    macTabs.querySelectorAll('button').forEach(item=>item.classList.toggle('is-active',item===button));
    renderMac(data.mac.find(item=>item.id===button.dataset.id));
  });

  const compareTabs=document.querySelector('#compareTabs');
  const compareResult=document.querySelector('#compareResult');
  function renderComparison(key){
    const item=data.compare[key];
    compareResult.innerHTML=`<h3>${item.title}</h3><div><article><span>TVŮJ WINDOWS PC</span><p>${item.pc}</p></article><article><span>MAC MINI M4</span><p>${item.mac}</p></article></div>`;
  }
  compareTabs.innerHTML=Object.entries(data.compare).map(([key,item],index)=>`<button data-key="${key}" class="${index?'':'is-active'}">${item.title}</button>`).join('');
  renderComparison('games');
  compareTabs.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    compareTabs.querySelectorAll('button').forEach(item=>item.classList.toggle('is-active',item===button));
    renderComparison(button.dataset.key);
  });

  document.querySelector('#compatibility').innerHTML=data.compat.map(([title,text],index)=>`<article><b>${String(index+1).padStart(2,'0')}</b><h3>${title}</h3><p>${text}</p></article>`).join('');
  const flow={
    ssd:'SSD uchovává data i bez napájení. Přes NVMe používá linky PCIe; po otevření programu se potřebná data načtou do RAM.',
    cpu:'CPU provádí obecné instrukce programu. S RAM komunikuje velmi rychle, s GPU předává úlohy například přes PCIe.',
    ram:'RAM je rychlá dočasná pracovní paměť. Není to úložiště: po vypnutí její obsah zmizí.',
    gpu:'GPU zpracuje obrazová data; VRAM je její vlastní rychlá paměť pro textury a framebuffer. Grafika pošle hotový obraz do monitoru.',
    monitor:'Monitor přijímá hotový obrazový signál z grafické karty. Obnovovací frekvence popisuje, kolikrát za sekundu může obraz obnovit.'
  };
  const flowDetail=document.querySelector('#flowDetail');
  document.querySelector('#dataFlow').addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    document.querySelectorAll('#dataFlow button').forEach(item=>item.classList.toggle('is-active',item===button));
    flowDetail.textContent=flow[button.dataset.flow];
  });

  const main=document.querySelector('main');
  const mac=document.querySelector('.pc-mac-section');
  const comparison=document.querySelector('.pc-compare-section');
  const conclusion=document.querySelector('.pc-conclusion');
  main.append(mac,comparison);
  conclusion.querySelector('a').href='#srovnani';
  conclusion.querySelector('a').textContent='Porovnat s Macem ↓';
})();
