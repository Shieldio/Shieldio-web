// Shieldio secret — tiny physical-board easter egg, intentionally standalone.
(function () {
  const target = "RED";
  let entered = "";
  const sequence = document.getElementById("secretSequence");
  const reward = document.getElementById("secretReward");
  const state = document.getElementById("secretConsoleState");
  const keys = [...document.querySelectorAll("[data-secret-key]")];

  function paintSequence() {
    sequence.textContent = target.split("").map((_, index) => entered[index] || "_").join(" ");
  }

  function reset(message) {
    entered = "";
    state.textContent = message;
    sequence.classList.add("is-error");
    setTimeout(() => {
      sequence.classList.remove("is-error");
      state.textContent = "čekám na vstup";
      paintSequence();
    }, 650);
  }

  keys.forEach(button => button.addEventListener("click", () => {
    if (!reward.hidden) return;
    entered += button.dataset.secretKey;
    paintSequence();
    state.textContent = "ověřuji " + entered;

    if (!target.startsWith(entered)) {
      reset("nesprávný signál");
      return;
    }
    if (entered === target) {
      state.textContent = "spojení navázáno";
      sequence.classList.add("is-complete");
      keys.forEach(key => { key.disabled = true; });
      reward.hidden = false;
      requestAnimationFrame(() => reward.classList.add("is-visible"));
      try { localStorage.setItem("shieldio-secret-unlocked", "RED"); } catch (_) {}
    }
  }));

  try {
    if (localStorage.getItem("shieldio-secret-unlocked") === "RED") {
      entered = target;
      paintSequence();
      state.textContent = "spojení navázáno";
      sequence.classList.add("is-complete");
      keys.forEach(key => { key.disabled = true; });
      reward.hidden = false;
      requestAnimationFrame(() => reward.classList.add("is-visible"));
    }
  } catch (_) {}
})();
