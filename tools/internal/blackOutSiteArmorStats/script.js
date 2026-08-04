const tableBody = document.querySelector("#weaponTable tbody");

let armors = [];

let sortColumn = "tier";
let sortAscending = false;

const filterButton = document.getElementById("filterButton");
const filterMenu = document.getElementById("filterMenu");
const filterObtainable = document.getElementById("filterObtainable");
const filterHelmet = document.getElementById("filterHelmet");
const filterChestplate = document.getElementById("filterChestplate");
const filterLeggings = document.getElementById("filterLeggings");
const filterBoots = document.getElementById("filterBoots");
const filterNoBinding = document.getElementById("filterNoBinding");

const kitFilters = document.getElementById("kitFilters");

let ownedKits = {};

fetch("internal/blackOutSiteArmorStats/armors.json")
    .then(r => r.json())
    .then(data => {
        armors = data;
        createKitFilters();
        render();
    })
    .catch(err => {
        console.error("Failed to load armors:", err);
    });

filterButton.addEventListener("click", () => {
    filterMenu.classList.toggle("active");
});

function getArmorReduction(armorPoints) {
    return armorPoints * 4;
}

function getCustomDefenseReduction(customDefense) {
    if (customDefense <= 25) {
        return customDefense * 1.2;
    } else if (customDefense <= 50) {
        return 30 + (customDefense - 25) * 0.6;
    } else if (customDefense <= 100) {
        return 45 + (customDefense - 50) * 0.4;
    } else if (customDefense <= 150) {
        return 65 + (customDefense - 100) * 0.2;
    } else if (customDefense <= 200) {
        return 75 + (customDefense - 150) * 0.15;
    } else {
        return Math.min(87.5, 82.5 + (customDefense - 200) * 0.05);
    }
}

function getTotalDamageReduction(armor) {
    const armorDR = getArmorReduction(armor.armorPoints) / 100;
    const customDR = getCustomDefenseReduction(armor.customDefense) / 100;

    return (1 - (1 - armorDR) * (1 - customDR)) * 100;
}

function isObtainable(a) {
    if (a.droppable) {
        return true;
    }

    if (a.requires && ownedKits[a.requires]) {
        return true;
    }

    return false;
}

[
    filterObtainable,
    filterHelmet,
    filterChestplate,
    filterLeggings,
    filterBoots,
    filterNoBinding
].forEach(filter => filter.addEventListener("change", render));

document.querySelectorAll(".sortable").forEach(header => {
    header.addEventListener("click", () => {

        const column = header.dataset.sort;

        if (sortColumn === column) {
            sortAscending = !sortAscending;
        } else {
            sortColumn = column;
            sortAscending = false;
        }

        render();
    });
});

function render() {
    tableBody.innerHTML = "";

    let filtered = [...armors];

    if (filterObtainable.checked) {
        filtered = filtered.filter(isObtainable);
    }

    const selectedTypes = [];

    if (filterHelmet.checked) selectedTypes.push("Helmet");
    if (filterChestplate.checked) selectedTypes.push("Chestplate");
    if (filterLeggings.checked) selectedTypes.push("Leggings");
    if (filterBoots.checked) selectedTypes.push("Boots");

    if (selectedTypes.length) {
        filtered = filtered.filter(a => selectedTypes.includes(a.slot));
    }

    if (filterNoBinding.checked) {
        filtered = filtered.filter(a => a.curseOfBinding !== true);
    }

    const ranked = [...armors]
        .sort((a, b) => getTotalDamageReduction(b) - getTotalDamageReduction(a));
    const tiers = new Map();

    ranked.forEach((armor, index) => {
        tiers.set(armor.name, index + 1);
    });

    if (sortColumn) {
        filtered.sort((a, b) => {
            let valueA;
            let valueB;

            if (sortColumn === "tier") {

                valueA = tiers.get(a.name);
                valueB = tiers.get(b.name);

                return sortAscending
                    ? valueB - valueA
                    : valueA - valueB;
            }

            valueA = Number(a[sortColumn] ?? 0);
            valueB = Number(b[sortColumn] ?? 0);

            return sortAscending
                ? valueA - valueB
                : valueB - valueA;
        });
    }


    filtered.forEach(a => {
        const row = document.createElement("tr");
        const damageReduction = getTotalDamageReduction(a).toFixed(1);


        row.innerHTML = `
            <td>${a.name}</td>
            <td>#${tiers.get(a.name)}</td>
            <td>${damageReduction}%</td>
            <td class="mobile-hide">${a.armorPoints}</td>
            <td>${a.customDefense}</td>
            <td class="mobile-hide" >${a.speed}</td>
            <td class="${isObtainable(a) ? "obtainable-yes" : "obtainable-no"}">
                ${a.obtainableText}
            </td>
        `;

        tableBody.appendChild(row);
    });

    document.querySelectorAll(".sort-icon").forEach(icon => {
        icon.textContent = "↕";
    });

    if (sortColumn) {
        const active = document.querySelector(
            `[data-sort="${sortColumn}"] .sort-icon`
        );

        if (active) {
            active.textContent = sortAscending ? "▲" : "▼";
        }
    }
}

function createKitFilters() {
    const kits = [
        ...new Set(
            armors
                .filter(a => a.requires)
                .map(a => a.requires)
        )
    ];

    kits.forEach(kit => {
        ownedKits[kit] = false;

        const label = document.createElement("label");

        label.innerHTML = `
            <input type="checkbox" data-kit="${kit}">
            ${kit}
        `;

        label.querySelector("input")
            .addEventListener("change", e => {
                ownedKits[kit] = e.target.checked;

                render();

            });

        kitFilters.appendChild(label);
    });
}
