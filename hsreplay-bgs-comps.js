// ==UserScript==
// @name         HSReplay.net Battlegrounds Comps Utils
// @namespace    http://tampermonkey.net/
// @version      2025-09-02.1
// @description  add utils to the HSReplay.net Battlegrounds Comps page
// @author       Brok3nPix3l
// @match        https://hsreplay.net/battlegrounds/comps/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hsreplay.net
// @grant        GM_addValueChangeListener
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==

(async function () {
    "use strict";

    if (location.href !== "https://hsreplay.net/battlegrounds/comps/") {
        const shouldRetrieveData = GM_getValue(location.href + "-retrieve-when-to-commit-data", false);
        if (!shouldRetrieveData) {
            console.debug("Data retrieval not requested, exiting.");
            return;
        }
        const guideSections = await wait_elements(document, "section.guide-content", 2);
        console.debug("found guideSections:");
        console.debug(guideSections);
        const guideSection = guideSections[1];
        console.debug("found guideSection:");
        console.debug(guideSection);
        const cards = guideSection.children[0];
        console.debug("found cards:");
        console.debug(cards);
        const whenToCommitCard = cards.children[3];
        console.debug("found whenToCommitCard:");
        console.debug(whenToCommitCard);
        const whenToCommitDetails = whenToCommitCard.children[1];
        console.debug("found whenToCommitDetails:");
        console.debug(whenToCommitDetails);
        GM_setValue(`${location.href}-when-to-commit`, whenToCommitDetails.textContent);
        console.debug(`${location.href}-when-to-commit set to: ${whenToCommitDetails.textContent}`);
        GM_setValue(`${location.href}-retrieve-when-to-commit-data`, false);
        window.close();
        return;
    }

    const main = await wait_element(document, "main");
    const container = main.children[3];
    console.debug("found container:");
    console.debug(container);
    const tierList = container.children[0].children[1];
    console.debug("found tierList:");
    console.debug(tierList);
    const filtersContainer = document.createElement("div");
    filtersContainer.style.display = "flex";
    filtersContainer.style.justifyContent = "space-between";
    filtersContainer.style.gap = "20px";
    filtersContainer.style.flexWrap = "wrap";
    filtersContainer.style.marginTop = "10px";
    filtersContainer.style.marginBottom = "10px";
    container.prepend(filtersContainer);
    
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
    
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Filters";
    resetButton.onclick = () => {
        checkboxElements.forEach(checkboxElement => {
            checkboxElement.checked = true;
            checkboxElement.dispatchEvent(new Event("change"));
        })
    };
    
    filtersContainer.appendChild(resetButton);
    
    const checkboxElements = [];
    tribes.forEach((tribe) => {
        const subContainer = document.createElement("div");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `${tribe}-checkbox`;
        checkbox.checked = true;
        
        const label = document.createElement("label");
        label.htmlFor = `${tribe}-checkbox`;
        label.textContent = `${tribe.charAt(0).toUpperCase() + tribe.slice(1)}`;
        label.style.color = "white";
        
        subContainer.appendChild(checkbox);
        subContainer.appendChild(label);
        filtersContainer.appendChild(subContainer);
        checkboxElements.push(checkbox);
        
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

    let compsMissingWhenToCommitValue = 0;
    Object.entries(compElementMappings).forEach(([comp, { element }]) => {
        const url = element.children[0].href;
        console.debug(`Displaying cached "when to commit" data for: ${comp} ${url}`);
        let whenToCommitDataElement = element.querySelector('.when-to-commit-data');
        if (!whenToCommitDataElement) {
            whenToCommitDataElement = document.createElement('div');
            whenToCommitDataElement.className = 'when-to-commit-data';
            whenToCommitDataElement.style.color = 'white';
            element.appendChild(whenToCommitDataElement);
        }
        const whenToCommitValue = GM_getValue(`${url}-when-to-commit`, null);
        if (whenToCommitValue === null) {
            whenToCommitDataElement.textContent = `When to commit: No data available. Fetch data to view`;
            compsMissingWhenToCommitValue++;
        } else {
            whenToCommitDataElement.textContent = `When to commit: ${whenToCommitValue}`;
        }
        GM_addValueChangeListener(`${url}-when-to-commit`, function(key, oldValue, newValue, remote) {
            console.debug(`Value for ${key} changed from ${oldValue} to ${newValue}`);
            if (newValue === null) {
                whenToCommitDataElement.textContent = `When to commit: Unavailable`;
            } else {
                whenToCommitDataElement.textContent = `When to commit: ${newValue}`;
            }
        });
    });
    if (compsMissingWhenToCommitValue > 0) {
        if (window.confirm(`There are ${compsMissingWhenToCommitValue} comp(s) missing "When to Commit" data. Would you like to fetch the data now?`)) {
            fetchMissingWhenToCommitData();
        }
    }
    

    // const clearWhenToCommitStorageContainer = document.createElement("div");
    // clearWhenToCommitStorageContainer.style.display = "flex";
    // clearWhenToCommitStorageContainer.style.gap = "20px";
    // clearWhenToCommitStorageContainer.style.flexWrap = "wrap";
    // container.prepend(clearWhenToCommitStorageContainer);

    // const clearWhenToCommitButton = document.createElement("button");
    // clearWhenToCommitButton.textContent = 'Clear all "When to Commit" Data';
    // clearWhenToCommitButton.onclick = () => {
    //     Object.entries(compElementMappings).forEach(([comp, { element }]) => {
    //         const url = element.children[0].href;
    //         GM_setValue(`${url}-when-to-commit`, null);
    //     });
    // };
    // clearWhenToCommitStorageContainer.appendChild(clearWhenToCommitButton);
    
    // const clearOneRandomCompWhenToCommitButton = document.createElement("button");
    // clearOneRandomCompWhenToCommitButton.textContent = 'Clear "When to Commit" Data for one Random Comp';
    // clearOneRandomCompWhenToCommitButton.onclick = () => {
    //     const randomComp = Object.keys(compElementMappings)[Math.floor(Math.random() * Object.keys(compElementMappings).length)];
    //     const url = compElementMappings[randomComp].element.children[0].href;
    //     GM_setValue(`${url}-when-to-commit`, null);
    // };
    // clearWhenToCommitStorageContainer.appendChild(clearOneRandomCompWhenToCommitButton);

    const whenToCommitContainer = document.createElement("div");
    whenToCommitContainer.style.display = "flex";
    whenToCommitContainer.style.justifyContent = "space-between";
    whenToCommitContainer.style.gap = "20px";
    whenToCommitContainer.style.flexWrap = "wrap";
    whenToCommitContainer.style.marginTop = "10px";
    whenToCommitContainer.style.marginBottom = "10px";
    container.prepend(whenToCommitContainer);
    

    const showWhenToCommitDataCheckboxSubContainer = document.createElement("div");
    whenToCommitContainer.appendChild(showWhenToCommitDataCheckboxSubContainer);
    
    const showWhenToCommitDataCheckbox = document.createElement("input");
    showWhenToCommitDataCheckbox.type = "checkbox";
    showWhenToCommitDataCheckbox.id = "show-when-to-commit-data";
    showWhenToCommitDataCheckbox.checked = true;
    showWhenToCommitDataCheckbox.addEventListener("change", function () {
        const whenToCommitDataElements = document.querySelectorAll('div.when-to-commit-data');
        if (showWhenToCommitDataCheckbox.checked) {
            console.debug("Showing 'When to Commit' data elements");
            whenToCommitDataElements.forEach((dataElement) => {
                dataElement.style.display = "block";
            });
        } else {
            console.debug("Hiding 'When to Commit' data elements");
            whenToCommitDataElements.forEach((dataElement) => {
                dataElement.style.display = "none";
            });
        }
    });
    showWhenToCommitDataCheckboxSubContainer.appendChild(showWhenToCommitDataCheckbox);

    const showWhenToCommitDataLabel = document.createElement("label");
    showWhenToCommitDataLabel.htmlFor = "show-when-to-commit-data";
    showWhenToCommitDataLabel.textContent = 'Show "When to Commit" Data';
    showWhenToCommitDataLabel.style.color = "white";
    showWhenToCommitDataCheckboxSubContainer.appendChild(showWhenToCommitDataLabel);

    const fetchMissingWhenToCommitDataButtonSubContainer = document.createElement("div");
    whenToCommitContainer.appendChild(fetchMissingWhenToCommitDataButtonSubContainer);
    
    const fetchMissingWhenToCommitDataButton = document.createElement("button");
    fetchMissingWhenToCommitDataButton.textContent = 'Fetch "When to Commit" Data for Missing Comps';
    const fetchMissingWhenToCommitDataWarningMessage = `This will open a new tab for each comp without "when to commit" data, scrape data, and then close the tabs`;
    fetchMissingWhenToCommitDataButton.onclick = () => window.confirm("Are you sure you want to fetch 'When to Commit' data for all comps missing it? " + fetchMissingWhenToCommitDataWarningMessage) && fetchMissingWhenToCommitData();
    fetchMissingWhenToCommitDataButtonSubContainer.appendChild(fetchMissingWhenToCommitDataButton);

    const fetchMissingWhenToCommitDataButtonWarningMessage = document.createElement("span");
    fetchMissingWhenToCommitDataButtonWarningMessage.textContent = "⚠";
    fetchMissingWhenToCommitDataButtonWarningMessage.style.color = "yellow";
    fetchMissingWhenToCommitDataButtonWarningMessage.title = fetchMissingWhenToCommitDataWarningMessage;
    fetchMissingWhenToCommitDataButtonSubContainer.appendChild(fetchMissingWhenToCommitDataButtonWarningMessage);
    
    const invalidateAndFetchWhenToCommitDataButtonSubContainer = document.createElement("div");
    whenToCommitContainer.appendChild(invalidateAndFetchWhenToCommitDataButtonSubContainer);

    const invalidateAndFetchWhenToCommitDataButton = document.createElement("button");
    invalidateAndFetchWhenToCommitDataButton.textContent = 'Fetch new "When to Commit" Data for ALL Comps';
    const invalidateAndFetchWhenToCommitDataWarningMessage = `This will open a new tab FOR EACH COMP (${Object.keys(compElementMappings).length}), scrape data, and then close the tabs`;
    invalidateAndFetchWhenToCommitDataButton.onclick = () => {
        window.confirm("Are you sure you want to fetch new 'When to Commit' data for all comps? " + invalidateAndFetchWhenToCommitDataWarningMessage) && Object.entries(compElementMappings).forEach(([comp, { element }]) => {
            const url = element.children[0].href;
            console.debug(`Fetching data for: ${comp} ${url}`);
            GM_setValue(`${url}-when-to-commit`, null);
            GM_setValue(`${url}-retrieve-when-to-commit-data`, true);
            GM_openInTab(url);
        });
    };
    invalidateAndFetchWhenToCommitDataButtonSubContainer.appendChild(invalidateAndFetchWhenToCommitDataButton);

    const invalidateAndFetchWhenToCommitDataButtonWarningMessage = document.createElement("span");
    invalidateAndFetchWhenToCommitDataButtonWarningMessage.textContent = "⚠";
    invalidateAndFetchWhenToCommitDataButtonWarningMessage.style.color = "red";
    invalidateAndFetchWhenToCommitDataButtonWarningMessage.title = invalidateAndFetchWhenToCommitDataWarningMessage;
    invalidateAndFetchWhenToCommitDataButtonSubContainer.appendChild(invalidateAndFetchWhenToCommitDataButtonWarningMessage);

    function fetchMissingWhenToCommitData() {
        Object.entries(compElementMappings).forEach(([comp, { element }]) => {
            const url = element.children[0].href;
            if (GM_getValue(`${url}-when-to-commit`, null) === null) {
                console.debug(`Fetching data for: ${comp} ${url}`);
                GM_setValue(`${url}-retrieve-when-to-commit-data`, true);
                GM_openInTab(url);
            }
        });
    }
    
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
    
    function wait_elements(root, selector, count) {
        return new Promise((resolve, reject) => {
            new MutationObserver(check).observe(root, {
                childList: true,
                subtree: true,
            });
            function check(changes, observer) {
                let elements = root.querySelectorAll(selector);
                if (elements.length >= count) {
                    observer.disconnect();
                    resolve(elements);
                }
            }
        });
    }

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
