async function loadGearRules() {
  const res = await fetch('assets/gearRules.json');
  return await res.json();
}

async function init() {
  const rules = await loadGearRules();

  document.getElementById('runOpt').addEventListener('click', () => {
    const out = [];

    // Example: list allowed stats for each slot
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
