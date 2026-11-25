const get = id => document.getElementById(id);
const cv = get('cv');
const job = get('job');
const draft = get('draft');
const status = get('status');

for (const input of [cv, job]) {
  input.addEventListener('input', () => input.setCustomValidity(''));
}

get('tailor-form').addEventListener('submit', event => {
  event.preventDefault();
  for (const input of [cv, job]) {
    if (!input.value.trim()) {
      input.setCustomValidity('Paste some text to continue.');
      input.reportValidity();
      return;
    }
  }
  const result = tailorCV(cv.value, job.value);
  draft.value = result.draft;
  get('matched').textContent = result.matched.join(', ') || 'No keywords matched.';
  get('missing').textContent = result.missing.join(', ') || 'No additional keywords found.';
  get('result-note').textContent = result.reordered
    ? 'Relevant bullets are now higher within their lists. Add any missing keywords only where they describe your experience.'
    : 'Your bullet order stayed the same. Use the keyword review to guide edits based on your experience.';
  status.textContent = '';
  get('results').hidden = false;
  get('result-title').focus();
});

get('example').addEventListener('click', () => {
  cv.value = 'Jamie Patel\nData Analyst\n\nExperience\nData Analyst, Harbor Retail\n- Documented internal reporting processes.\n- Built SQL dashboards to track sales and customer retention.\n- Automated weekly reports using Python.\n\nEducation\nBSc in Statistics';
  job.value = 'We are hiring a Data Analyst to build SQL dashboards and monitor customer retention. You will use SQL for analysis and Python to automate reports. Tableau is preferred.';
  cv.setCustomValidity('');
  job.setCustomValidity('');
  cv.focus();
});

get('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    status.textContent = 'CV copied.';
  } catch {
    draft.focus();
    draft.select();
    status.textContent = 'Draft selected. Use your device’s copy command.';
  }
});

get('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([draft.value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tailored-cv.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Download started.';
});
