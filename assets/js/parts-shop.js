// Neveřejný výběr součástek: uprav ceny a nabídku pouze v tomto poli.
(function () {
  const products = [
    { id: "nano", name: "Arduino Nano", detail: "kompatibilní deska · USB-C", price: 95, icon: "N", category: "Řízení" },
    { id: "ultrasonic", name: "Ultrazvuk HC-SR04", detail: "měření vzdálenosti", price: 38, icon: "US", category: "Senzory" },
    { id: "ir", name: "IR senzor", detail: "odrazový / sledování čáry", price: 32, icon: "IR", category: "Senzory" },
    { id: "servo", name: "Servo SG90", detail: "9 g · mikroservo", price: 58, icon: "S", category: "Pohyb" },
    { id: "motor", name: "DC motor", detail: "malý motor pro projekty", price: 45, icon: "M", category: "Pohyb" },
    { id: "led", name: "LED diody", detail: "balení 10 ks · mix barev", price: 18, icon: "LED", category: "Základy" },
    { id: "resistors", name: "Rezistory", detail: "balení 20 ks · běžné hodnoty", price: 15, icon: "Ω", category: "Základy" },
    { id: "button", name: "Tlačítko", detail: "tact switch · balení 5 ks", price: 12, icon: "BTN", category: "Základy" },
    { id: "wires", name: "Propojovací vodiče", detail: "Dupont M–M · balení", price: 45, icon: "MM", category: "Prototypování" },
    { id: "breadboard", name: "Nepájivé pole", detail: "mini breadboard", price: 38, icon: "▦", category: "Prototypování" },
  ];
  const key = "shieldio-parts-shop-cart-v1";
  const productRoot = document.querySelector("[data-products]");
  const itemRoot = document.querySelector("[data-cart-items]");
  const countRoot = document.querySelector("[data-cart-count]");
  const totalRoot = document.querySelector("[data-cart-total]");
  const clearButton = document.querySelector("[data-clear-cart]");
  const copyButton = document.querySelector("[data-copy-order]");
  const downloadButton = document.querySelector("[data-download-order]");
  const statusRoot = document.querySelector("[data-copy-status]");
  let cart = load();
  const money = value => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);

  function load() { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { return {}; } }
  function save() { try { localStorage.setItem(key, JSON.stringify(cart)); } catch (_) {} }
  function amount(id) { return Math.max(0, Number(cart[id]) || 0); }
  function setAmount(id, value) { const next = Math.max(0, Math.min(99, Number(value) || 0)); if (next) cart[id] = next; else delete cart[id]; save(); render(); }
  function visibleItems() { return products.filter(product => amount(product.id)); }
  function orderTotal() { return visibleItems().reduce((sum, product) => sum + product.price * amount(product.id), 0); }
  function message() {
    const rows = visibleItems().map(product => `• ${product.name} — ${amount(product.id)} ${amount(product.id) === 1 ? "ks" : "ks"} × ${money(product.price)} = ${money(product.price * amount(product.id))}`);
    return ["Ahoj, chtěl/a bych přidat k další objednávce:", "", ...rows, "", `Orientační součet: ${money(orderTotal())}`, "", "Prosím o potvrzení dostupnosti a finální ceny. Díky!"].join("\n");
  }
  function renderProducts() {
    productRoot.innerHTML = products.map(product => `<article class="parts-product"><div class="parts-product-visual" aria-hidden="true">${product.icon}</div><div class="parts-product-main"><span>${product.category}</span><h2>${product.name}</h2><p>${product.detail}</p><strong>${money(product.price)}</strong></div><div class="parts-stepper" aria-label="Počet pro ${product.name}"><button type="button" data-change="-1" data-id="${product.id}" aria-label="Odebrat ${product.name}">−</button><output data-product-count="${product.id}">${amount(product.id)}</output><button type="button" data-change="1" data-id="${product.id}" aria-label="Přidat ${product.name}">+</button></div></article>`).join("");
  }
  function renderCart() {
    const items = visibleItems(); const total = orderTotal(); const count = items.reduce((sum, product) => sum + amount(product.id), 0);
    countRoot.textContent = `${count} ${count === 1 ? "položka" : count < 5 ? "položky" : "položek"}`;
    totalRoot.textContent = money(total);
    itemRoot.innerHTML = items.length ? items.map(product => `<div class="parts-cart-row"><span><b>${product.name}</b><small>${amount(product.id)} ks × ${money(product.price)}</small></span><strong>${money(product.price * amount(product.id))}</strong></div>`).join("") : '<p class="parts-empty">Zatím nic. Vyber součástky vlevo.</p>';
    clearButton.hidden = !items.length; copyButton.disabled = !items.length; downloadButton.disabled = !items.length;
  }
  function render() { renderProducts(); renderCart(); }
  productRoot.addEventListener("click", event => { const button = event.target.closest("[data-change]"); if (button) setAmount(button.dataset.id, amount(button.dataset.id) + Number(button.dataset.change)); });
  clearButton.addEventListener("click", () => { cart = {}; save(); statusRoot.textContent = "Košík je prázdný."; render(); });
  copyButton.addEventListener("click", async () => { try { await navigator.clipboard.writeText(message()); statusRoot.textContent = "Zpráva je zkopírovaná. Vlož ji do soukromé zprávy."; } catch (_) { statusRoot.textContent = "Kopírování se nepovedlo — stáhni si seznam .txt."; } });
  downloadButton.addEventListener("click", () => { const blob = new Blob([message()], { type: "text/plain;charset=utf-8" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "shieldio-objednavka.txt"; link.click(); URL.revokeObjectURL(link.href); statusRoot.textContent = "Seznam byl stažen."; });
  render();
}());
