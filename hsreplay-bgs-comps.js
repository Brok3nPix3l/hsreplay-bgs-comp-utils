// ==UserScript==
// @name         HSReplay.net Battlegrounds Comps Utils
// @namespace    http://tampermonkey.net/
// @version      2025-08-23
// @description  add utils to the HSReplay.net Battlegrounds Comps page
// @author       Brok3nPix3l
// @match        https://hsreplay.net/battlegrounds/comps/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hsreplay.net
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  function wait_element(root, selector) {
    return new Promise((resolve, reject) => {
      new MutationObserver(check).observe(root, {
        childList: true,
        subtree: true,
      });
      function check(changes, observer) {
        let element = root.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      }
    });
  }

  const tierList = await wait_element(document, "div.sc-fIIVfa.dDMitD");
  console.log("found tierList:");
  console.log(tierList);
  const container = document.querySelector("div.sc-joCieG.gXKmMR");
  const checkboxContainer = document.createElement('div');
  container.prepend(checkboxContainer);

  const tribes = [
    "beast",
    "demon",
    "dragon",
    "elemental",
    "mech",
    "murloc",
    "naga",
    "pirate",
    "quilboar",
    "undead",
  ];

  const tribeToCompMappings = {};
  Array.from(tierList.children).map((tier) =>
    Array.from(tier.children[1].children).map((comp) => {
        const compName = comp.children[0].children[0].children[1].children[1].children[0].innerText;
        console.log(compName);
        const tribeName = compName.split(" ")[0].toLowerCase();
        if (!tribeToCompMappings[tribeName]) {
          tribeToCompMappings[tribeName] = new Set();
        }
        tribeToCompMappings[tribeName].add(comp);
    })
  );

  tribes.forEach(tribe => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${tribe}-checkbox`;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = `${tribe}-checkbox`;
    label.textContent = tribe;

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
            console.log(`${tribe} is now checked!`);
            tribeToCompMappings[tribe]?.forEach(comp => {
              comp.style.display = 'block';
            });
            tribeToCompMappings[`${tribe}s`]?.forEach(comp => {
              comp.style.display = 'block';
            });
        } else {
            console.log(`${tribe} is now unchecked!`);
            tribeToCompMappings[tribe]?.forEach(comp => {
              comp.style.display = 'none';
            });
            tribeToCompMappings[`${tribe}s`]?.forEach(comp => {
              comp.style.display = 'none';
            });
        }
    });
  });
})();
