
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
