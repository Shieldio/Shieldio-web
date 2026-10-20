# Původ a licence

Editor, výuková zapojení a MNA/číslicová vrstva této aplikace jsou nová implementace. Zdrojový kód CircuitJS/Falstadu ani Multisimu není převzat.

Volitelné SPICE jádro:

- **EEcircuit-engine 1.8.0**, Danial Chitnis, MIT. Oficiální zdroj: https://github.com/eelab-dev/EEcircuit-engine . Distribuce: https://www.npmjs.com/package/eecircuit-engine .
- Distribuce obsahuje WebAssembly sestavení **ngspice** a knihovny modelů s vlastními licenčními oznámeními, zachovanými v distribuovaném modulu. Přehled ngspice: https://ngspice.sourceforge.io/ .
- Knihovna modelů GF180 uvádí Copyright 2022 GlobalFoundries PDK Authors, Apache License 2.0. Pro naše školní obvody se tyto procesové modely nevybírají.

Pevný SHA-256 distribuovaného modulu:

`a4a4776888e6fbbd1c1be755adba8bc48c0921a26649e86c7539c40433cfe66e`

Nástroj `prepare-vendor.mjs` odmítne změněnou distribuci. Konečná aplikace nevyžaduje připojení studentova prohlížeče k CDN.
