// Shieldio — pre-order variant picker: live total from data-price, scales to any number of options

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".preorder");
  if (!form) return;

  const radios = form.querySelectorAll('input[name="varianta"]');
  const qtyInput = form.querySelector("#preorder-qty");
  const totalDisplay = form.querySelector("#preorder-total-price");
  const totalHidden = form.querySelector("#preorder-total-hidden");

  function updateTotal() {
    const selected = form.querySelector('input[name="varianta"]:checked');
    const price = selected ? parseInt(selected.dataset.price, 10) : 0;
    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    const totalText = (price * qty).toLocaleString("cs-CZ") + " Kč";
    totalDisplay.textContent = totalText;
    totalHidden.value = totalText;
  }

  radios.forEach(radio => radio.addEventListener("change", updateTotal));
  qtyInput.addEventListener("input", updateTotal);
  updateTotal();
});
