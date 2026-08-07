// Shieldio — product picker (products index page)

document.addEventListener("DOMContentLoaded", () => {
  const boardCards = document.querySelectorAll(".board-pick-card");
  const tierStep = document.querySelector("#tier-step");

  if (!boardCards.length) return;

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
});
