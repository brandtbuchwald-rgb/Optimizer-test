// ==========================
// Rediscover Gear Optimizer (slot layout)
// ==========================

// Normal stat pool (non-weapon)
const NORMAL_POOL = [
  "ATK SPD","Crit Chance","Evasion","ATK%","Crit DMG",
  "Monster DMG","HP%","DEF%","Damage Reduction"
];

// Purple (5th line) stat pool by slot
const PURPLE_BY_SLOT = {
  Weapon:   ["Crit DMG +80%"],
  Helm:     ["Boss DMG +40%"],
  Belt:     ["Boss DMG +40%"],
  Ring:     ["Crit DMG +40%"],
  Necklace: ["Crit DMG +40%"],
  Chest:    ["ATK% +26%"],
  Gloves:   ["ATK% +26%"],
  Boots:    ["ATK% +26%"]
};

// Build gear set
function buildGearSet(tier, focus){
  const slots = ["Weapon","Necklace","Helm","Chest","Ring","Belt","Gloves","Boots"];
  const result = {};
  let atkspdUsed = false; // only one ATK SPD globally

  slots.forEach(slot=>{
    const lines = [];
    const priorities = (focus==="Tank")
      ? ["ATK SPD","Evasion","Damage Reduction","HP%","DEF%","ATK%","Crit DMG","Monster DMG"]
      : ["ATK SPD","Crit Chance","Evasion","ATK%","Crit DMG","Monster DMG","HP%","DEF%"];
    const normalCount = tier==="Primal" ? 3 : 4;

    // Purple 5th line if Chaos/Abyss
    if(tier==="Chaos"||tier==="Abyss"){
      if(PURPLE_BY_SLOT[slot]) {
        lines.push(`<span style="background:#7c3aed;color:#fff;padding:2px 6px;border-radius:6px">${PURPLE_BY_SLOT[slot][0]} (5th)</span>`);
      }
    }

    let capUsed = false;
    for(const stat of priorities){
      if(lines.length >= normalCount + (tier==="Chaos"||tier==="Abyss"?1:0)) break;

      // Weapons cannot roll cap stats
      if(slot==="Weapon" && ["ATK SPD","Crit Chance","Evasion"].includes(stat)) continue;

      // ATK SPD only once globally
      if(stat==="ATK SPD" && atkspdUsed) continue;

      // one cap per piece
      if(["ATK SPD","Crit Chance","Evasion"].includes(stat)){
        if(capUsed) continue;
        capUsed = true;
      }

      if(stat==="ATK SPD") atkspdUsed = true;
      lines.push(stat);
    }
    result[slot] = lines;
  });
  return result;
}

// Render gear set into UI
function renderGearSet(tier, focus){
  const plan = buildGearSet(tier, focus);
  const container = document.createElement("div");
  container.className = "card gear-card";
  container.innerHTML = `
    <div class="inner">
      <hr style="border:0;border-top:1px solid var(--border);margin:12px 0 16px">
      <h2 style="margin-top:0">Recommended Gear</h2>
      <div style="font-size:13px;opacity:.8;margin-bottom:12px">
        Set: <strong>${tier}</strong> | Focus: <strong>${focus}</strong>
      </div>
      ${Object.entries(plan).map(([slot, lines])=>`
        <div style="margin-bottom:14px">
          <strong>${slot}</strong>
          <ul style="margin:6px 0 0 18px;padding:0">
            ${lines.map(l=>`<li>${l}</li>`).join("")}
          </ul>
        </div>
      `).join("")}
    </div>`;
  document.querySelector("main").appendChild(container);
}
