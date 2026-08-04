const compareButton = document.getElementById("compareButton");
const compareResults = document.getElementById("compareResults");

compareButton.addEventListener("click", compareArmor);

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

function protectionReduction(level) {
    return Math.min(level * 4, 20);
}

function totalReduction(armorPoints, customDefense, protectionLevel) {

    const armor = getArmorReduction(armorPoints) / 100;
    const custom = getCustomDefenseReduction(customDefense) / 100;
    const protection = protectionReduction(protectionLevel) / 100;

    return (1 - (1 - armor) * (1 - custom) * (1 - protection)) * 100;
}

fetch("internal/blackOutSiteArmorStats/armors.json")
    .then(r => r.json())
    .then(data => {
        armors = data;
    })
    .catch(err => {
        console.error("Failed to load armors:", err);
    });

/* We don't care about CI kits now since they are obtainable no reason to filter :p */
function isObtainable(a) {
    return a.droppable;
}

function compareArmor() {
    compareResults.innerHTML = "";

    const slot = document.getElementById("compareSlot").value;
    const armorPoints = Number(document.getElementById("compareArmorPoints").value);
    const customDefense = Number(document.getElementById("compareDefense").value);
    const protection = Number(document.getElementById("compareProt").value);

    const obtainableOnly = document.getElementById("compareObtainable").checked;
    const noBinding = document.getElementById("compareBinding").checked;

    const currentReduction = totalReduction(
        armorPoints,
        customDefense,
        protection
    );

    const summary = document.createElement("div");
    summary.className = "compare-result";

    summary.innerHTML = `
        <h2>Your Armor</h2>

        <p><strong>Armor Points:</strong> ${armorPoints}</p>
        <p><strong>Custom Defense:</strong> ${customDefense}</p>
        <p><strong>Protection:</strong> ${protection}</p>

        <hr>

        <h3>Total Damage Reduction</h3>

        <h2>${currentReduction.toFixed(2)}%</h2>
    `;

    compareResults.appendChild(summary);

    let results = armors.filter(a => a.slot === slot);

    if (obtainableOnly) {
        results = results.filter(isObtainable);
    }

    if (noBinding) {
        results = results.filter(a => !a.curseOfBinding);
    }

    results = results.map(armor => {
        const reduction = totalReduction(
            armor.armorPoints,
            armor.customDefense,
            armor.protectionLevel || 0
        );

        return {
            armor,
            reduction,
            improvement: reduction - currentReduction
        };
    });

    results = results
        .filter(x => x.improvement > 0)
        .sort((a, b) => a.improvement - b.improvement);

    if (results.length === 0) {
        const div = document.createElement("div");
        div.className = "compare-result";

        div.innerHTML = `
            <h2>No Better Armor Found</h2>

            <p>Your armor is already stronger than all current armor.</p>
        `;

        compareResults.appendChild(div);

        return;
    }

    results.forEach(item => {
        const div = document.createElement("div");
        div.className = "compare-result upgrade";

        div.innerHTML = `
            <h3>${item.armor.name}</h3>

            <p><strong>Damage Reduction:</strong> ${item.reduction.toFixed(2)}%</p>

            <p style="color:#6cff8f;">
                <strong>+${item.improvement.toFixed(2)}%</strong> better than yours
            </p>

            <hr>

            <p><strong>Armor Points:</strong> ${item.armor.armorPoints}</p>
            <p><strong>Custom Defense:</strong> ${item.armor.customDefense}</p>
            <p><strong>Protection:</strong> ${item.armor.protectionLevel || 0}</p>

            <p>${item.armor.obtainableText}</p>
        `;

        compareResults.appendChild(div);
    });
}
