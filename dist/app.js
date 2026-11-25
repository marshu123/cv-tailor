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
  get('result-note').textContent = result.addedHighlights
    ? 'Relevant Highlights pulls matching achievements from your CV into a section near the top.'
    : result.reordered
      ? 'Relevant bullets are now higher within their lists.'
      : 'This draft keeps your original order. Use the keyword review to guide your edits.';
  status.textContent = '';
  get('results').hidden = false;
  draft.focus();
  draft.setSelectionRange(0, 0);
  draft.scrollTop = 0;
});

draft.addEventListener('input', () => {
  status.textContent = 'Draft updated. Copy and download use your edits.';
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

get('pdf').addEventListener('click', () => {
  if (!draft.value.trim()) {
    status.textContent = 'Enter some draft text before exporting.';
    draft.focus();
    return;
  }
  status.textContent = 'Choose Save as PDF in the print dialog.';
  window.print();
});

window.addEventListener('beforeprint', () => {
  const printDraft = get('pdf-draft');
  printDraft.textContent = draft.value;
  document.body.classList.toggle('printing-draft', Boolean(draft.value.trim()));
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-draft');
  get('pdf-draft').textContent = '';
});
