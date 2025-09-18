// === Load Gear Rules ===
async function loadGearRules() {
  const res = await fetch('assets/gearRules.json');
  return await res.json();
}

// === ATK SPD Calculator Core ===
const baseOriginal={"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2};
const basePrimal={"Berserker":2.0,"Paladin":2.4,"Ranger":1.8,"Sorcerer":2.2};
const basePvP={"Berserker":2.2,"Paladin":2.5,"Ranger":2.0,"Sorcerer":2.3};
const base={"Original":baseOriginal,"Primal":basePrimal,"Chaos":baseOriginal,"Abyss":basePrimal,"PVP/Boss":basePvP};

const TARGET_FINAL=0.25;
const SET_VAL={Abyss:0.16,Chaos:0.14,Original:0.12,Primal:0.12};
const MAX_EQUIP_PIECES=8;

// Caps
const CRIT_CAP = 0.50;   // 50%
const EVA_CAP  = 0.40;   // 40%
const DR_CAP   = 1.00;   // 100%

// Calculator state
function currentState(cls, weap, fury, quick, guild, secret, rune, petPct){
  const baseSpd=base[weap][cls];
  const buffsBase=(guild+secret);
  const denom=Math.max(baseSpd*(1-quick)*(fury && cls==='Berserker'?0.25:1.0),1e-9);
  const requiredTotal=1-(TARGET_FINAL/denom);
  const buffsAll=buffsBase + rune + petPct;
  const requiredRemaining=Math.max(0, requiredTotal-buffsAll);
  const finalRaw=baseSpd*(1-buffsAll)*(1-quick)*(fury && cls==='Berserker'?0.25:1.0);
  const finalSpd=Math.max(finalRaw,TARGET_FINAL);
  return {baseSpd,requiredRemaining,finalSpd,buffsBase};
}

// Optimizer combos
function planCombos(cls,weap,buffsBase,fury){
  const chosen=weap;
  const pieceVal=SET_VAL[chosen]||0;
  if(!pieceVal) return [];
  const denom0=Math.max(base[weap][cls]*(fury && cls==='Berserker'?0.25:1.0),1e-9);
  const requiredTotal0=1-(TARGET_FINAL/denom0);
  const need=Math.max(0, requiredTotal0 - buffsBase);
  const pets=[{name:'S',v:0.12},{name:'A',v:0.09},{name:'B',v:0.06},{name:'None',v:0.00}];
  const results=[];
  for(let pieces=0; pieces<=MAX_EQUIP_PIECES; pieces++){
    const equipPct=pieces*pieceVal;
    for(let qLevel=0; qLevel<=2; qLevel++){ // ≤2 only
      const q=qLevel/100;
      for(let runePct=0.06; runePct>=-1e-9; runePct-=0.01){
        const rFix=Math.max(0,runePct);
        for(const pet of pets){
          const coverage=equipPct + rFix + pet.v + q;
          if(coverage + 1e-9 >= need){
            const waste=coverage-need;
            results.push({set:chosen,quickLevel:qLevel,pieces,equipPct,rune:Math.round(rFix*100),pet:pet.name,total:coverage,waste});
            break;
          }
        }
      }
    }
  }
  results.sort((a,b)=>(a.pieces-b.pieces)||(a.quickLevel-b.quickLevel)||(b.rune-a.rune)||(b.petV-a.petV)||(a.waste-b.waste));
  return results.slice(0,7);
}

// Slot Recommendations with caps enforced
function recommendStatsForSlot(slot, rules, priorities, tier, critSoFar=0, evaSoFar=0, drSoFar=0){
  const slotRules=rules.slots[slot];
  const validNormal=(Array.isArray(slotRules.normal)?slotRules.normal:rules[slotRules.normal]);
  const rec=[];
  let capUsed=false;

  for(const stat of priorities){
    if(!validNormal.includes(stat)) continue;

// Exclude cap stats from weapons
if(slot === "Weapon" && ["ATK SPD","Crit Chance","Evasion"].includes(stat)) continue;
    // Cap stat restriction
    if(["ATK SPD","Crit Chance","Evasion"].includes(stat)){
      if(capUsed) continue;
      if(stat==="Crit Chance" && critSoFar>=CRIT_CAP) continue;
      if(stat==="Evasion" && evaSoFar>=EVA_CAP) continue;
      capUsed=true;
    }

    if(stat==="Damage Reduction" && drSoFar>=DR_CAP) continue;
    rec.push(stat);

    // Stop when we hit tier line count
    const maxCount=rules.tiers[tier].normalLines;
    if(rec.length>=maxCount) break;
  }

  if(slotRules.purple.length){
    rec.push(`(Purple option: ${slotRules.purple.join(" / ")})`);
  }

  return rec;
}

// === Init ===
async function init(){
  const rules=await loadGearRules();

  // Calculator button
  document.getElementById('calcBtn').addEventListener('click',()=>{
    const cls=document.getElementById('cls').value;
    const weap=document.getElementById('weap').value;
    const guild=parseFloat(document.getElementById('guild').value||0)/100;
    const secret=parseFloat(document.getElementById('secret').value||0)/100;
    const rune=parseFloat(document.getElementById('rune').value||0)/100;
    const petPct=parseFloat(document.getElementById('pet').value||0)/100;
    const quick=parseFloat(document.getElementById('quicken').value||0)/100;
    const fury=document.getElementById('fury').checked;

    const state=currentState(cls,weap,fury,quick,guild,secret,rune,petPct);
    document.getElementById('calcResult').textContent=
      `Base Speed: ${state.baseSpd}\nRequired Remaining: ${(state.requiredRemaining*100).toFixed(2)}%\nFinal Speed: ${state.finalSpd.toFixed(2)}`;
  });

  // Optimizer button
  document.getElementById('runOpt').addEventListener('click',()=>{
    const cls=document.getElementById('cls').value;
    const weap=document.getElementById('weap').value;
    const tier=document.getElementById('optSet').value; // New tier selector
    const guild=parseFloat(document.getElementById('guild').value||0)/100;
    const secret=parseFloat(document.getElementById('secret').value||0)/100;
    const rune=parseFloat(document.getElementById('rune').value||0)/100;
    const petPct=parseFloat(document.getElementById('pet').value||0)/100;
    const quick=parseFloat(document.getElementById('quicken').value||0)/100;
    const fury=document.getElementById('fury').checked;

    const state=currentState(cls,weap,fury,quick,guild,secret,rune,petPct);
    const combos=planCombos(cls,weap,state.buffsBase,fury);
    const out=[];

    if(combos.length){
      out.push("Best Combo Suggestions:");
      combos.forEach(c=>{
        out.push(`${c.set}: ${c.pieces} pcs (${(c.equipPct*100).toFixed(2)}%) | Rune ${c.rune}% | Pet ${c.pet} | Quicken Lv.${c.quickLevel} → covers ${(c.total*100).toFixed(2)}% (waste ${(c.waste*100).toFixed(2)}%)`);
      });
    } else {
      out.push("No valid combos found (with quicken ≤2).");
    }

    // Slot recommendations
    out.push("\n--- Slot Recommendations ---");
    ["DPS","Tank"].forEach(type=>{
      out.push(`${type} priorities (${tier}):`);
      let critSoFar=0, evaSoFar=0, drSoFar=0;
      for(const slot in rules.slots){
        const rec=recommendStatsForSlot(slot,rules,rules.priorities[type],tier,critSoFar,evaSoFar,drSoFar);
        // update running totals using per-line values
        const vals=rules.capValues;
        if(rec.includes("Crit Chance")) critSoFar+=vals["Crit Chance"][tier];
        if(rec.includes("Evasion")) evaSoFar+=vals["Evasion"][tier];
        if(rec.includes("Damage Reduction")) drSoFar+=vals["Damage Reduction"][tier];
        out.push(`  ${slot}: ${rec.join(", ")}`);
      }
      out.push("");
    });

    document.getElementById('output').textContent=out.join('\n');
  });
}

init();
