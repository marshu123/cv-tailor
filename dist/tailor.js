const ignoredWords = new Set(
  'about across after also an and are as at be been by can company could description do for from had has have having help hiring if in into is it its job join more must of on or our out over role should team than that the their them these they this through to up use using want was we were what when where which who will with work would year years you your experience required preferred looking ability strong excellent including such'.split(' ')
);

function terms(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#]*(?:[.-][\p{L}\p{N}+#]+)*/gu) || [])
    .filter(word => word.length > 1 && !ignoredWords.has(word) && /\p{L}/u.test(word));
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

  const lines = cv.trim().split(/\r?\n/);
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

  return { draft: lines.join('\n'), matched, missing, reordered };
}
