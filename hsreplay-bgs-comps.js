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
  console.debug("found tierList:");
  console.debug(tierList);
  const container = document.querySelector("div.sc-joCieG.gXKmMR");
  const checkboxContainer = document.createElement('div');
  checkboxContainer.style.display = "flex";
  checkboxContainer.style.gap = "20px";
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
        console.debug(compName);
        const tribeName = compName.split(" ")[0].toLowerCase();
        if (!tribeToCompMappings[tribeName]) {
          tribeToCompMappings[tribeName] = new Set();
        }
        tribeToCompMappings[tribeName].add(comp);
    })
  );

  tribes.forEach(tribe => {
    const subContainer = document.createElement('div');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${tribe}-checkbox`;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = `${tribe}-checkbox`;
    label.textContent = `${tribe.charAt(0).toUpperCase() + tribe.slice(1)}`;

    subContainer.appendChild(checkbox);
    subContainer.appendChild(label);
    checkboxContainer.appendChild(subContainer);

    checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
            console.debug(`${tribe} is now checked!`);
            tribeToCompMappings[tribe]?.forEach(comp => {
              comp.style.display = 'block';
            });
            tribeToCompMappings[`${tribe}s`]?.forEach(comp => {
              comp.style.display = 'block';
            });
        } else {
            console.debug(`${tribe} is now unchecked!`);
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
