# TODO / Roadmap

Zoznam plánovaných vylepšení a známych obmedzení. História hotových zmien je v [CHANGELOG.md](CHANGELOG.md).

## Známe obmedzenia

- **Testy `setup.test.ts`** — 5 testov je momentálne nefunkčných (zastaraná signatúra voči `/api/auth/setup`). Netýka sa behu aplikácie, ale `npm run test:run` skončí červené. Treba aktualizovať testy podľa aktuálnej implementácie setup routy.
- **`package-lock.json` nie je verzovaný** — zámerné rozhodnutie (neplatný semver z optional platform bindings láme `npm install` na Verceli). Dôsledok: build nie je bit-to-bit reprodukovateľný. Zvážiť `npm-shrinkwrap` alebo pinovanie verzií.
- **Node verzia nie je pripnutá** — chýba `engines` pole v `package.json` / `.nvmrc`. Odporúčané Node 20 LTS.

## Nápady na ďalší vývoj

- **Export z Komplexného prehľadu** — momentálne export do Excelu žije len na obrazovke Osobné (`/personal`); Komplexný prehľad zatiaľ export nemá.
- **Prihlasovací odkaz pre aktívnych používateľov** z tabuľky správy používateľov (teraz je tam len „znovu odoslať aktiváciu" pre čakajúce účty).
- **Audit log** — kto kedy importoval výpis, pozval/zmazal používateľa, zmenil prístupy.
- **Stránkovanie / filtre** vo väčších tabuľkách (osoby, výpisy) pri veľkom objeme dát.
