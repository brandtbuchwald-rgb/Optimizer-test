// === Load Gear Rules ===
async function loadGearRules() {
  const res = await fetch('assets/gearRules.json');
  return await res.json();
}

// === ATK SPD Calculator Core (simplified) ===
const base = {
  "Original": {"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2},
  "Primal":   {"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2},
  "Chaos":    {"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2},
  "Abyss":    {"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2},
  "PVP/Boss": {"Berserker":2.2,"Paladin":2.5,"Ranger":2.0,"Sorcerer":2.3}
};
const TARGET_FINAL = 0.25;

function calcAtkSpd(cls, weap) {
  const baseSpd = base[weap][cls];
  const finalSpd = baseSpd * 0.5; // placeholder math
  return { baseSpd, finalSpd };
}

// === Optimizer ===
async function init() {
  const rules = await loadGearRules();

  // Button: Calculator
  document.getElementById('calcBtn').addEventListener('click', () => {
    const cls = document.getElementById('cls').value;
    const weap = document.getElementById('weap').value;
    const res = calcAtkSpd(cls, weap);
    document.getElementById('calcResult').textContent =
      `Base Speed: ${res.baseSpd}\nFinal Speed: ${res.finalSpd}`;
  });

  // Button: Optimizer
  document.getElementById('runOpt').addEventListener('click', () => {
    const out = [];
    for (const slot in rules.slots) {
      const s = rules.slots[slot];
      out.push(`${slot}:`);
      out.push(`  Normal → ${Array.isArray(s.normal) ? s.normal.join(', ') : s.normal}`);
      out.push(`  Purple → ${s.purple.join(', ')}`);
      if (s.duplicationAllowed.length) {
        out.push(`  Duplicates allowed → ${s.duplicationAllowed.join(', ')}`);
      }
      out.push('');
    }
    document.getElementById('output').textContent = out.join('\n');
  });
}

init();
