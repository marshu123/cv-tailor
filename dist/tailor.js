const ignoredWords = new Set(
  'about across after also an and are as at be been by can company could description do for from had has have having help hiring if in into is it its job join more must of on or our out over role should team than that the their them these they this through to up use using want was we were what when where which who will with work would year years you your experience required preferred looking ability strong excellent including such'.split(' ')
);

function terms(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#]*(?:[.-][\p{L}\p{N}+#]+)*/gu) || [])
    .filter(word => word.length > 1 && !ignoredWords.has(word) && /\p{L}/u.test(word));
}

const achievementVerbs = new Map(Object.entries({
  achieved: 'Reached', automated: 'Set up automation for', built: 'Developed',
  collaborated: 'Worked', completed: 'Finished', created: 'Produced',
  delivered: 'Provided', designed: 'Planned', developed: 'Built',
  implemented: 'Put in place', improved: 'Enhanced', maintained: 'Kept',
  managed: 'Oversaw', reduced: 'Lowered', resolved: 'Fixed',
  supported: 'Helped support', tested: 'Ran tests on', wrote: 'Authored'
}));

function rewriteAchievement(line, relevance) {
  const match = line.match(/^(\s*(?:[-*•▪–]\s+)?)([A-Za-z]+)(\s+.+[.!?])(\s*)$/u);
  if (!match || relevance(match[2] + match[3]) === 0) return line;
  const [, prefix, verb, remainder, trailing] = match;
  const action = achievementVerbs.get(verb.toLowerCase());
  if (!action) return line;

  // Lead with a tool or method already named in the statement when it matches the job.
  const method = remainder.match(/^(.+?)\s+using\s+([^,;.!?]+)([.!?])$/u);
  if (method && relevance(method[2]) > 0) {
    return prefix + 'Using ' + method[2] + ', ' + verb.toLowerCase() + method[1] + method[3] + trailing;
  }
  return prefix + action + remainder + trailing;
}

function tailorCV(cv, job) {
  const weights = new Map();
  for (const word of terms(job)) weights.set(word, (weights.get(word) || 0) + 1);

  const cvTerms = new Set(terms(cv));
  const keywords = [...weights.keys()].sort((a, b) => weights.get(b) - weights.get(a));
  const matched = keywords.filter(word => cvTerms.has(word)).slice(0, 12);
  const missing = keywords.filter(word => !cvTerms.has(word)).slice(0, 12);
  const relevance = line => [...new Set(terms(line))]
    .reduce((score, word) => score + (weights.get(word) || 0), 0);

  const originalLines = cv.trim().split(/\r?\n/);
  let rewritten = 0;
  const lines = originalLines.map(line => {
    const updated = rewriteAchievement(line, relevance);
    rewritten += Number(updated !== line);
    return updated;
  });
  // Use complete achievement statements, including those pasted without bullets.
  const achievement = /^(?:[-*•▪–]\s+)?(?:achieved|automated|built|collaborated|completed|created|delivered|designed|developed|implemented|improved|launched|led|managed|maintained|reduced|resolved|supported|tested|wrote)\b.+[.!?]$/i;
  const highlights = [...new Set(originalLines.map(line => line.trim()).filter(line => achievement.test(line)))]
    .map(line => line.replace(/^[-*•▪–]\s+/, ''))
    .map(line => ({ line, score: relevance(line) }))
    .filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const isBullet = line => /^\s*(?:[-*•▪–]\s+|\d+[.)]\s+)/u.test(line);
  const indent = line => line.match(/^\s*/)[0].replace(/\t/g, '    ').length;
  let reordered = 0;
  for (let start = 0; start < lines.length;) {
    if (!isBullet(lines[start])) {
      start++;
      continue;
    }
    const level = indent(lines[start]);
    const bullets = [];
    let end = start;
    while (end < lines.length && isBullet(lines[end]) && indent(lines[end]) === level) {
      const group = [lines[end++]];
      while (end < lines.length && lines[end].trim() && indent(lines[end]) > level) {
        group.push(lines[end++]);
      }
      bullets.push({ group, score: relevance(group.join(' ')) });
    }
    // List numbering can carry meaning, so keep numbered lists in their original order.
    if (!bullets.some(({group}) => /^\s*\d+[.)]/.test(group[0]))) {
      const ranked = [...bullets].sort((a, b) => b.score - a.score);
      reordered += Number(ranked.some((bullet, index) => bullet !== bullets[index]));
      lines.splice(start, end - start, ...ranked.flatMap(bullet => bullet.group));
    }
    start = end;
  }

  const contentStart = lines.findIndex(line => /^(?:profile|(?:professional |career )?summary|(?:technical )?skills|(?:(?:work|professional|relevant) )?experience|(?:software |selected )?projects|education)\s*:?\s*$/i.test(line.trim()));
  const addedHighlights = highlights.length > 0 && contentStart > 0
    && !lines.some(line => /^\s*relevant highlights\s*:?\s*$/i.test(line));
  if (addedHighlights) {
    lines.splice(contentStart, 0, 'RELEVANT HIGHLIGHTS', ...highlights.map(({line}) => '- ' + rewriteAchievement(line, relevance)), '');
    if (lines[contentStart - 1].trim()) lines.splice(contentStart, 0, '');
  }
  return { draft: lines.join('\n'), matched, missing, reordered, addedHighlights, rewritten };
}
