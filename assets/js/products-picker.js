// Shieldio — product picker (products index page)

document.addEventListener("DOMContentLoaded", () => {
  const boardCards = document.querySelectorAll(".board-pick-card");
  const tierStep = document.querySelector("#tier-step");
  const tierButtons = document.querySelectorAll(".tier-pick-btn");

  if (!boardCards.length) return;

  const tierLinks = {
    green: "GREEN.html",
    yellow: "YELLOW.html",
    red: "RED.html",
  };

  boardCards.forEach(card => {
    card.addEventListener("click", () => {
      const board = card.dataset.board;
      if (board === "baseline") {
        boardCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        tierStep.classList.add("active");
      } else if (card.dataset.href) {
        window.location.href = card.dataset.href;
      }
    });
  });

  tierButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tier = btn.dataset.tier;
      if (tierLinks[tier]) window.location.href = tierLinks[tier];
    });
  });
});
