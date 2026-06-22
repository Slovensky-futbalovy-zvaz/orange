# TODO / Roadmap

Zoznam plánovaných vylepšení a známych obmedzení. História hotových zmien je v [CHANGELOG.md](CHANGELOG.md).

## Známe obmedzenia

- **`package-lock.json` nie je verzovaný** — zámerné rozhodnutie (neplatný semver z optional platform bindings láme `npm install` na Verceli). Dôsledok: build nie je bit-to-bit reprodukovateľný. Zvážiť `npm-shrinkwrap` alebo pinovanie verzií.

## Nápady na ďalší vývoj

- **Export z Komplexného prehľadu** — momentálne export do Excelu žije len na obrazovke Osobné (`/personal`); Komplexný prehľad zatiaľ export nemá.
- **Prihlasovací odkaz pre aktívnych používateľov** z tabuľky správy používateľov (teraz je tam len „znovu odoslať aktiváciu" pre čakajúce účty).
- **Audit log** — kto kedy importoval výpis, pozval/zmazal používateľa, zmenil prístupy.
- **Stránkovanie / filtre** vo väčších tabuľkách (osoby, výpisy) pri veľkom objeme dát.
