// Shieldio — project picker (instructions/baseline/red page)

document.addEventListener("DOMContentLoaded", () => {
  const projectCards = document.querySelectorAll(".project-pick-card");
  const panel = document.querySelector("#project-panel");
  const panelTitle = document.querySelector("#project-panel-title");
  const panelText = document.querySelector("#project-panel-text");

  if (!projectCards.length || !panel) return;

  projectCards.forEach(card => {
    card.addEventListener("click", () => {
      projectCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      const project = card.dataset.project;
      panelTitle.textContent = `Návod „${project}“ se připravuje`;
      panelText.textContent = `Pracujeme na krok-za-krokem návodu pro projekt ${project}. Mrkni prosím zpátky později.`;
      panel.classList.add("active");
    });
  });
});
