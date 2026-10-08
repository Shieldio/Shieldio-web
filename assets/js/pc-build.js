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

  const mac=data.mac;
  document.querySelector('#macDetail').innerHTML=`<p class="learn-eyebrow">M4 · REFERENČNÍ PRACOVNÍ VARIANTA</p><h3>${mac.name}</h3><strong class="pc-detail-price">${money(mac.price)}</strong><p class="pc-price-status">${mac.priceNote}</p><p>${mac.description}</p><ul>${mac.specs.map(spec=>`<li>${spec}</li>`).join('')}</ul><a class="pc-source" href="${mac.sourceUrl}" target="_blank" rel="noopener">${mac.sourceLabel} ↗</a>`;
  document.querySelector('#macBenefits').innerHTML=data.macBenefits.map((item,index)=>`<article><b>${String(index+1).padStart(2,'0')} · ${item.metric}</b><h3>${item.title}</h3><p>${item.description}</p></article>`).join('');
  const extrasTotal=mac.price+sum(data.appleExtras);
  document.querySelector('#macSetup').innerHTML=`<div class="pc-apple-setup-head"><p class="learn-eyebrow">Kompletní pracovní stůl s Macem</p><h3>${money(extrasTotal)}</h3><p>Mac mini, QHD monitor, klávesnice, myš, headset a aktivní stereo. Cena Macu je převzatá z podkladu srovnání; příslušenství má přímé odkazy na konkrétní produkty.</p></div><div class="pc-apple-setup-list"><article><span>MAC</span><b>${mac.name}</b><strong>${money(mac.price)}</strong></article>${data.appleExtras.map(item=>`<article><span>${item.category}</span><b>${item.name}</b><strong>${money(item.price)}</strong><small>${item.note}</small>${item.alzaUrl?`<a href="${item.alzaUrl}" target="_blank" rel="noopener">Detail Alza ↗</a>`:''}</article>`).join('')}</div>`;
  document.querySelector('#macLimits').innerHTML=data.macLimits.map(item=>`<li>${item}</li>`).join('');
  document.querySelector('#compatibility').innerHTML=data.compat.map(([title,text],index)=>`<article><b>${String(index+1).padStart(2,'0')}</b><h3>${title}</h3><p>${text}</p></article>`).join('');
})();
