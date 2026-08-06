// Shieldio — guide picker (instructions page)

document.addEventListener("DOMContentLoaded", () => {
  const boardCards = document.querySelectorAll(".board-pick-card");
  const tierStep = document.querySelector("#tier-step");
  const tierButtons = document.querySelectorAll(".tier-pick-btn");
  const guidePanel = document.querySelector("#guide-panel");
  const guidePanelTitle = document.querySelector("#guide-panel-title");
  const guidePanelText = document.querySelector("#guide-panel-text");

  if (!boardCards.length || !guidePanel) return;

  const tierNames = {
    green: "Green",
    yellow: "Yellow",
    red: "Red",
  };

  const tierLinks = {
    red: "baseline/red/index.html",
  };

  const showGuide = (board, tierKey) => {
    const label = tierKey ? `${board} · ${tierNames[tierKey]}` : board;
    guidePanelTitle.textContent = `Návody pro ${label} se připravují`;
    guidePanelText.textContent = tierKey
      ? `Pracujeme na sadě návodů pro desku ${board} v úrovni ${tierNames[tierKey]}. Mrkni prosím zpátky později.`
      : `Pracujeme na sadě návodů pro řadu ${board}. Mrkni prosím zpátky později.`;
    guidePanel.classList.add("active");
  };

  boardCards.forEach(card => {
    card.addEventListener("click", () => {
      boardCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      guidePanel.classList.remove("active");

      const board = card.dataset.board;
      if (board === "baseline") {
        tierStep.classList.add("active");
        tierButtons.forEach(b => b.classList.remove("active"));
      } else {
        tierStep.classList.remove("active");
        showGuide(card.dataset.label);
      }
    });
  });

  tierButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tier = btn.dataset.tier;
      if (tierLinks[tier]) {
        window.location.href = tierLinks[tier];
        return;
      }
      tierButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showGuide("Baseline", tier);
    });
  });
});
