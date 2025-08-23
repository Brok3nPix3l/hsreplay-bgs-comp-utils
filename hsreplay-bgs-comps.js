// ==UserScript==
// @name         HSReplay.net Battlegrounds Comps Utils
// @namespace    http://tampermonkey.net/
// @version      2025-08-22
// @description  add utils to the HSReplay.net Battlegrounds Comps page
// @author       Brok3nPix3l
// @match        https://hsreplay.net/battlegrounds/comps/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hsreplay.net
// @grant        none
// @license      MIT
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
    const checkboxContainer = document.createElement("div");
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

    const tierToCompMappings = {};
    const tierElementMappings = [];
    const compElementMappings = [];
    const compToTierMappings = {};
    const tribeToCompMappings = {};
    Array.from(tierList.children).map((tierElement) => {
        const tierName = tierElement.children[0].innerText;
        tierElementMappings[tierName] = {
            element: tierElement,
            display: tierElement.style.display,
        };
        Array.from(tierElement.children[1].children).map((compElement) => {
            const compName =
                compElement.children[0].children[0].children[1].children[1]
                    .children[0].innerText;
            console.debug(compName);
            compElementMappings[compName] = {
                element: compElement,
                display: compElement.style.display,
            };
            if (!tierToCompMappings[tierName]) {
                tierToCompMappings[tierName] = [];
            }
            tierToCompMappings[tierName].push(compName);
            compToTierMappings[compName] = tierName;
            const tribeName = compName.split(" ")[0].toLowerCase();
            if (!tribeToCompMappings[tribeName]) {
                tribeToCompMappings[tribeName] = [];
            }
            tribeToCompMappings[tribeName].push(compName);
        });
    });
    console.debug("tierToCompMappings:");
    console.debug(tierToCompMappings);
    console.debug("compToTierMappings:");
    console.debug(compToTierMappings);
    console.debug("tribeToCompMappings:");
    console.debug(tribeToCompMappings);
    console.debug("tierElementMappings:");
    console.debug(tierElementMappings);
    console.debug("compElementMappings:");
    console.debug(compElementMappings);

    tribes.forEach((tribe) => {
        const subContainer = document.createElement("div");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `${tribe}-checkbox`;
        checkbox.checked = true;

        const label = document.createElement("label");
        label.htmlFor = `${tribe}-checkbox`;
        label.textContent = `${tribe.charAt(0).toUpperCase() + tribe.slice(1)}`;

        subContainer.appendChild(checkbox);
        subContainer.appendChild(label);
        checkboxContainer.appendChild(subContainer);

        checkbox.addEventListener("change", function () {
            const comps = [];
            [tribe, `${tribe}s`].forEach(spelling => {
                comps.push(...(tribeToCompMappings[spelling] || []));
            });
            console.debug(`comps to update: ${comps}`);
            if (checkbox.checked) {
                console.debug(`${tribe} is now checked!`);
                comps.forEach((comp) => {
                    revealComp(comp);
                    revealTier(compToTierMappings[comp]);
                });
            } else {
                console.debug(`${tribe} is now unchecked!`);
                comps.forEach((comp) => {
                    hideComp(comp);
                    if (getAllCompElementsForTier(compToTierMappings[comp]).filter(
                        (compElementWithSameTier) => compElementWithSameTier.style.display !== "none"
                    ).length === 0) {
                        hideTier(compToTierMappings[comp]);
                    }
                });
            }
        });
    });

    function getAllCompElementsForTier(tier) {
        return (
            tierToCompMappings[tier]?.map(
                (comp) => compElementMappings[comp].element
            ) || []
        );
    }

    function getDisplayStyleForComp(comp) {
        return compElementMappings[comp]?.display;
    }

    function getDisplayStyleForTier(tier) {
        return tierElementMappings[tier]?.display;
    }

    function revealComp(comp) {
        console.debug(`Revealing comp: ${comp}`);
        const compElement = compElementMappings[comp].element;
        compElement.style.display = getDisplayStyleForComp(comp);
    }

    function hideComp(comp) {
        console.debug(`Hiding comp: ${comp}`);
        const compElement = compElementMappings[comp].element;
        compElement.style.display = "none";
    }

    function revealTier(tier) {
        console.debug(`Revealing tier: ${tier}`);
        const tierElement = tierElementMappings[tier].element;
        tierElement.style.display = getDisplayStyleForTier(tier);
    }

    function hideTier(tier) {
        console.debug(`Hiding tier: ${tier}`);
        const tierElement = tierElementMappings[tier].element;
        tierElement.style.display = "none";
    }
})();
