const tableBody = document.querySelector("#weaponTable tbody");

let weapons = [];

let sortColumn = "dps";
let sortAscending = false;

const filterButton = document.getElementById("filterButton");
const filterMenu = document.getElementById("filterMenu");
const filterObtainable = document.getElementById("filterObtainable");

const kitFilters = document.getElementById("kitFilters");

let ownedKits = {};

fetch("internal/blackOutSiteWeaponsStats/weapons.json", {
    cache: "no-store"
})
    .then(r => r.json())
    .then(data => {
        weapons = data;
        createKitFilters();
        render();
    })
    .catch(err => {
        console.error("Failed to load weapons:", err);
    });

filterButton.addEventListener("click", () => {
    filterMenu.classList.toggle("active");
});

function isObtainable(w) {
    if (w.droppable) {
        return true;
    }

    if (w.requires && ownedKits[w.requires]) {
        return true;
    }

    return false;
}

filterObtainable.addEventListener("change", render);

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

function getAttackSpeed(w) {
    return 4 + w.attackSpeed;
}

function getDPS(w) {
    return w.damage * getAttackSpeed(w);
}

function render() {
    tableBody.innerHTML = "";

    let filtered = [...weapons];

    if (filterObtainable.checked) {
        filtered = filtered.filter(w => {

            if (w.droppable) {
                return true;
            }

            if (w.requires && ownedKits[w.requires]) {
                return true;
            }

            return false;
        });
    }

    const ranked = [...weapons]
        .sort((a, b) => getDPS(b) - getDPS(a));

    const ranks = new Map();

    ranked.forEach((weapon, index) => {
        ranks.set(weapon.name, index + 1);
    });

    if (sortColumn) {
        filtered.sort((a, b) => {

            let valueA;
            let valueB;

            if (sortColumn === "dps") {
                valueA = getDPS(a);
                valueB = getDPS(b);
            } else {
                valueA = Number(a[sortColumn] ?? 0);
                valueB = Number(b[sortColumn] ?? 0);
            }

            return sortAscending
                ? valueA - valueB
                : valueB - valueA;

        });

    }

    filtered.forEach(w => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${w.name}</td>
            <td>#${ranks.get(w.name)}</td>
            <td>${getDPS(w).toFixed(1)}</td>
            <td>${w.damage}</td>
            <td>${w.attackSpeed}</td>
            <td class="${isObtainable(w) ? "obtainable-yes" : "obtainable-no"}">
                ${w.obtainableText}
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
            weapons
                .filter(w => w.requires)
                .map(w => w.requires)
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
