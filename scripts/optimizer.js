// ==========================
// Rediscover Optimizer (full)
// ==========================

// ---- Load rules ----
async function loadGearRules() {
  const res = await fetch('assets/gearRules.json');
  return await res.json();
}

// ---- Base speeds ----
const baseOriginal = {"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2};
const basePrimal   = {"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2};
const basePvP      = {"Berserker":2.2,"Paladin":2.5,"Ranger":2.0,"Sorcerer":2.3};

const baseByWeapon = {
  "Original": baseOriginal,
  "Primal":   basePrimal,
  "Chaos":    baseOriginal,
  "Abyss":    basePrimal,
  "PVP/Boss": basePvP
};

// ---- Targets ----
const TARGET_FINAL = 0.25;
const SET_VAL = { Abyss:0.16, Chaos:0.14, Original:0.12, Primal:0.12 };
const MAX_EQUIP_PIECES = 8;

// ---- Caps ----
const CRIT_CAP = 0.50;
const EVA_CAP  = 0.40;
const DR_CAP   = 0.88; // from your rules

// ---- Utils ----
const clamp = (x,min,max)=>Math.max(min,Math.min(max,x));
const pct  = v => (parseFloat(v||0)/100);

// ---- Current state ----
function currentState(params){
  const {
    cls, weaponTier, furyChecked, quickPct,
    guildPct, guildCritPct,
    secretAtkPct, secretCritPct, secretEvaPct,
    runePct, petPct, charTypePct, statColorPct,
    includeGearRune=true
  } = params;

  const baseSpd = baseByWeapon[weaponTier][cls];
  const nonGearBuffs = guildPct + secretAtkPct + charTypePct + statColorPct;

  const rune = includeGearRune ? runePct : 0;
  const pet  = petPct;
  const furyMul = (furyChecked && cls === "Berserker") ? 0.25 : 1.0;

  const denom = Math.max(baseSpd * (1 - quickPct) * furyMul, 1e-9);
  const requiredTotal = 1 - (TARGET_FINAL / denom);
  const buffsAll = nonGearBuffs + rune + pet;
  const requiredRemaining = Math.max(0, requiredTotal - buffsAll);

  const finalRaw = baseSpd * (1 - buffsAll) * (1 - quickPct) * furyMul;
  const finalSpd = Math.max(finalRaw, TARGET_FINAL);

  return {
    baseSpd, requiredTotal, requiredRemaining, finalSpd,
    nonGearBuffs, furyMul,
    guildCritPct, secretCritPct, secretEvaPct
  };
}

// ---- Combos ----
function planCombos(cls, weaponTier, gearTier, nonGearBuffs, furyMul){
  const pieceVal = SET_VAL[gearTier] || 0;
  if(!pieceVal) return [];

  const baseSpd = baseByWeapon[weaponTier][cls];
  const denom0 = Math.max(baseSpd * (1 - 0) * furyMul, 1e-9);
  const requiredTotal0 = 1 - (TARGET_FINAL / denom0);
  const need = Math.max(0, requiredTotal0 - nonGearBuffs);

  const pets = [{name:'S',v:0.12},{name:'A',v:0.09},{name:'B',v:0.06},{name:'None',v:0.00}];
  const results = [];

  for(let pieces=0; pieces<=MAX_EQUIP_PIECES; pieces++){
    const equipPct = pieces * pieceVal;
    for(let qLevel=0; qLevel<=2; qLevel++){
      const q = qLevel/100;
      for(let runePct=0.06; runePct>=-1e-9; runePct-=0.01){
        const rFix = Math.max(0, runePct);
        for(const pet of pets){
          const coverage = equipPct + rFix + pet.v + q;
          if(coverage + 1e-9 >= need){
            const waste = coverage - need;
            results.push({
              set: gearTier,
              quickLevel: qLevel,
              pieces,
              equipPct,
              rune: Math.round(rFix*100),
              pet: pet.name,
              total: coverage,
              waste
            });
            break;
          }
        }
      }
    }
  }

  results.sort((a,b)=>
    (a.pieces-b.pieces) ||
    (a.quickLevel-b.quickLevel) ||
    (b.rune-a.rune) ||
    (a.waste-b.waste)
  );

  return results.slice(0,7);
}

// ---- Slot recs ----
function recommendStatsForSlot(
  slot, rules, focus, tier,
  critSoFar=0, evaSoFar=0, drSoFar=0, atkspdSoFar=0,
  critFromOther=0, evaFromOther=0
){
  const slotRules = rules.slots[slot];
  const validNormal = Array.isArray(slotRules.normal) ? slotRules.normal : rules.universalStats;
  const rec = [];

  // ATK SPD always first (not on weapon)
  if(validNormal.includes("ATK SPD") && slot!=="Weapon" && atkspdSoFar < 1.0){
    rec.push("ATK SPD");
    atkspdSoFar += rules.capValues["ATK SPD"] ? (rules.capValues["ATK SPD"][tier]||0) : 0;
  }

  // Crit Chance
  if(validNormal.includes("Crit Chance") && critSoFar + critFromOther < CRIT_CAP){
    rec.push("Crit Chance");
    critSoFar += rules.capValues["Crit Chance"][tier] || 0;
  }

  // Evasion
  if(validNormal.includes("Evasion") && evaSoFar + evaFromOther < EVA_CAP){
    rec.push("Evasion");
    evaSoFar += rules.capValues["Evasion"][tier] || 0;
  }

  // Focus extras
  const extras = (focus==="DPS")
    ? ["ATK%","Crit DMG","Monster DMG"]
    : ["Damage Reduction","HP%","DEF%","ATK%"];

  for(const extra of extras){
    if(rec.length >= rules.tiers[tier].normalLines) break;
    if(!validNormal.includes(extra)) continue;
    if(extra==="Damage Reduction" && drSoFar>=DR_CAP) continue;
    rec.push(extra);
    if(extra==="Damage Reduction") drSoFar += rules.capValues["Damage Reduction"][tier] || 0;
  }

  // Weapon specials
  if(slot==="Weapon"){
    if(focus==="DPS" && validNormal.includes("Cast Demon Lord")) rec.push("Cast Demon Lord");
    if(focus==="Tank" && validNormal.includes("Cast Evasion")) rec.push("Cast Evasion");
  }

  // Purple 5th
  if(rules.tiers[tier].purple && slotRules.purple.length){
    if(focus==="DPS"){
      rec.push("Purple: " + (slotRules.purple.includes("Crit DMG") ? "Crit DMG" : slotRules.purple[0]));
    } else {
      rec.push("Purple: " + (slotRules.purple.includes("HP%") ? "HP%" :
        (slotRules.purple.includes("Damage Reduction") ? "Damage Reduction" : "Crit DMG")));
    }
  }

  return rec;
}

// ---- Init ----
async function init(){
  const rules = await loadGearRules();

  document.getElementById('calcBtn').addEventListener('click',()=>{
    const cls        = document.getElementById('cls').value;
    const focus      = document.getElementById('focus').value;
    const weaponTier = document.getElementById('weap').value;
    const gearTier   = document.getElementById('gearTier').value;

    const guildPct   = pct(document.getElementById('guild').value);
    const guildCrit  = pct(document.getElementById('guildCrit').value);
    const secretAtk  = pct(document.getElementById('secret').value);
    const secretCrit = pct(document.getElementById('secretCrit').value);
    const secretEva  = pct(document.getElementById('secretEva').value);
    const runePct    = pct(document.getElementById('rune').value);
    const petPct     = pct(document.getElementById('pet').value);
    const quickPct   = pct(document.getElementById('quicken').value);
    const charTypePct  = pct(document.getElementById("charType").value);
    const statColorPct = pct(document.getElementById("statColor").value);
    const fury       = document.getElementById('fury').checked;

    const state = currentState({
      cls, weaponTier,
      furyChecked: fury, quickPct,
      guildPct, guildCritPct: guildCrit,
      secretAtkPct: secretAtk,
      secretCritPct: secretCrit,
      secretEvaPct: secretEva,
      runePct, petPct,
      charTypePct, statColorPct,
      includeGearRune: true
    });

    const lines = [];
    lines.push(`Base Speed: ${state.baseSpd}`);
    lines.push(`Required Remaining: ${(state.requiredRemaining*100).toFixed(2)}%`);
    lines.push(`Final Speed: ${state.finalSpd.toFixed(2)}`);
    lines.push("");
    lines.push("=== Total Stat Breakdown (summary) ===");
    lines.push(`ATK SPD (non-gear buffs combined): ${((state.nonGearBuffs + runePct + petPct)*100).toFixed(1)}%`);
    lines.push(`Crit Chance (incl. secret+guild): ${((state.guildCritPct+state.secretCritPct)*100).toFixed(1)}% + gear`);
    lines.push(`Evasion (incl. secret): ${(state.secretEvaPct*100).toFixed(1)}% + gear`);
    lines.push(`Damage Reduction: gear only`);
    document.getElementById('calcResult').textContent = lines.join('\n');
  });

  document.getElementById('runOpt').addEventListener('click',()=>{
    const cls        = document.getElementById('cls').value;
    const focus      = document.getElementById('focus').value;
    const weaponTier = document.getElementById('weap').value;
    const gearTier   = document.getElementById('gearTier').value;

    const guildPct   = pct(document.getElementById('guild').value);
    const guildCrit  = pct(document.getElementById('guildCrit').value);
    const secretAtk  = pct(document.getElementById('secret').value);
    const secretCrit = pct(document.getElementById('secretCrit').value);
    const secretEva  = pct(document.getElementById('secretEva').value);
    const runePct    = pct(document.getElementById('rune').value);
    const petPct     = pct(document.getElementById('pet').value);
        const quickPct   = pct(document.getElementById('quicken').value);
    const charTypePct  = pct(document.getElementById("charType").value);
    const statColorPct = pct(document.getElementById("statColor").value);
    const fury       = document.getElementById('fury').checked;

    const s0 = currentState({
      cls, weaponTier,
      furyChecked:fury, quickPct,
      guildPct, secretAtkPct:secretAtk,
      runePct:0, petPct,
      charTypePct, statColorPct,
      includeGearRune:false
    });

    const combos = planCombos(cls, weaponTier, gearTier, s0.nonGearBuffs, s0.furyMul);
    const out = [];

    if(combos.length){
      out.push("Best Combo Suggestions:");
      combos.forEach(c=>{
        out.push(`${c.set}: ${c.pieces} pcs (${(c.equipPct*100).toFixed(2)}%) | Rune ${c.rune}% | Pet ${c.pet} | Quicken Lv.${c.quickLevel} → covers ${(c.total*100).toFixed(2)}% (waste ${(c.waste*100).toFixed(2)}%)`);
      });
    } else {
      out.push("No valid combos found (with quicken ≤2).");
    }

    out.push("\n--- Slot Recommendations ---");
    out.push(`${focus} priorities (${gearTier}):`);

    let critGear=0, evaGear=0, drGear=0;
    for(const slot in rules.slots){
      const rec = recommendStatsForSlot(slot, rules, focus, gearTier, critGear, evaGear, drGear);
      const vals = rules.capValues;
      if(rec.includes("Crit Chance"))      critGear = Math.min(CRIT_CAP, critGear + vals["Crit Chance"][gearTier]);
      if(rec.includes("Evasion"))          evaGear  = Math.min(EVA_CAP,  evaGear  + vals["Evasion"][gearTier]);
      if(rec.includes("Damage Reduction")) drGear   = Math.min(DR_CAP,   drGear   + vals["Damage Reduction"][gearTier]);
      out.push(`  ${slot}: ${rec.join(", ")}`);
    }

    const secretCrit = pct(document.getElementById('secretCrit').value);
    const secretEva  = pct(document.getElementById('secretEva').value);

    const critFinal = critGear + secretCrit + guildCrit;
    const evaFinal  = evaGear  + secretEva;
    const drFinal   = drGear;

    out.push("");
    out.push(`Final Crit Chance (incl. secret): ${(critFinal*100).toFixed(1)}%`);
    out.push(`Final Evasion (incl. secret): ${(evaFinal*100).toFixed(1)}%`);
    out.push(`Final Damage Reduction: ${(drFinal*100).toFixed(1)}%`);

    document.getElementById('output').textContent = out.join('\n');
  });
}

init();
