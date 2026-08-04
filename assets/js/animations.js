
document.addEventListener("DOMContentLoaded", () => {

    const button = document.createElement("button");
    button.textContent = "Spustit test animace";

    const bar = document.createElement("div");
    const progress = document.createElement("div");

    const status = document.createElement("p");

    button.id = "testButton";
    bar.id = "testBar";
    progress.id = "testProgress";
    status.id = "testStatus";

    bar.appendChild(progress);

    document.body.appendChild(button);
    document.body.appendChild(bar);
    document.body.appendChild(status);


    button.addEventListener("click", () => {

        let value = 0;

        status.textContent = "Animace běží...";
        progress.style.width = "0%";

        const animation = setInterval(() => {

            value++;

            progress.style.width = value + "%";

            if (value >= 100) {
                clearInterval(animation);
                status.textContent = "Animace dokončena";
            }

        }, 20);

    });

});





document.addEventListener("DOMContentLoaded", () => {

    const elements = document.querySelectorAll(".fade-up");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        {
            threshold: 0.15
        }
    );

    elements.forEach(element => {
        observer.observe(element);
    });

});
