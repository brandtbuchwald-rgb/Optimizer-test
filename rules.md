# Rediscover Optimizer Rules

This file is the permanent record of all optimizer rules.  
Keep it versioned in the repo so nothing is lost when we reset.

---

## 1. Gear tiers & line counts
- **Primal** → 3 normal stats  
- **Original** → 4 normal stats  
- **Chaos / Abyss** → 4 normal stats + 1 purple (5th line)  

---

## 2. Universal gear pool (non-weapons)
- ATK SPD  
- Crit Chance  
- Evasion  
- ATK%  
- Crit DMG  
- Monster DMG  
- HP%  
- DEF%  
- Damage Reduction  

**No duplicates** in the normal pool. Purple can duplicate under exceptions.

---

## 3. Purple line exceptions
- **Helmet / Belt** → Boss DMG **or** HP% (can stack with normal)  
- **Chest / Gloves / Boots** → ATK% (can stack with normal)  
- **Ring / Necklace** → Crit DMG (can stack with normal)  
- **Weapon purple** → Crit DMG +80 (DPS) OR HP% +52% (Tank)  

---

## 4. Weapon pool
Weapons cannot roll ATK SPD, Crit Chance, or Evasion.  

- **Primal/Original weapons** → ATK%, Crit DMG, Monster DMG, Cast Demon Lord (17%), Cast Evasion (17%)  
- **Chaos/Abyss weapons** → ATK%, Crit DMG, Monster DMG, Cast Demon Lord (19%), Cast Evasion (19%)  

---

## 5. Build priorities
**All builds** → ATK SPD must cap (comes from gear/rune, not weapons).  

- **DPS builds**
  1. ATK SPD (cap)
  2. Crit Chance
  3. Evasion
  4. ATK%
  5. Crit DMG
  6. Monster DMG
  7. HP%
  8. DEF%

- **Tank builds**
  1. ATK SPD (cap)
  2. Evasion
  3. Damage Reduction
  4. HP%
  5. DEF%
  6. ATK%
  7. Crit DMG

---

## 6. Cap-stat restrictions
- **Cap stats** = ATK SPD, Crit Chance, Evasion.  
- Only **one cap stat per gear item** (no doubles like ATK SPD + Crit Chance on the same piece).  

---

## 7. Global caps (equipment + rune only)
- Crit Chance = **50%** max  
- Evasion = **40%** max  
- Damage Reduction = **100%** max  
- ATK SPD → must reach target breakpoint (calculator handles this)  

---

This rulebook is the single source of truth for the Optimizer + Calculator.
