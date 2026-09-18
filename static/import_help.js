(() => {
  const prompt = document.getElementById('import-prompt');
  const button = document.getElementById('copy-import-prompt');
  const status = document.getElementById('copy-status');
  if (prompt && button) button.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(prompt.value);
      else { prompt.focus(); prompt.select(); if (!document.execCommand('copy')) throw new Error('copy'); prompt.setSelectionRange(0, 0); }
      status.textContent = 'Prompt copiado!';
    } catch { status.textContent = 'Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.'; }
  });
  const search = document.getElementById('faq-search');
  const empty = document.getElementById('faq-empty');
  const count = document.getElementById('faq-count');
  if (!search) return;
  const groups = Array.from(document.querySelectorAll('.faq-category'));
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  search.addEventListener('input', () => {
    const term = normalize(search.value);
    let visible = 0;
    for (const group of groups) {
      let inGroup = 0;
      for (const item of group.querySelectorAll('.faq-item')) {
        const match = !term || normalize(item.textContent).includes(term);
        item.hidden = !match;
        if (match) inGroup++;
        if (!term) item.open = false;
      }
      group.hidden = !inGroup;
      if (term && inGroup) group.open = true;
      if (!term) group.open = false;
      visible += inGroup;
    }
    count.textContent = `${visible} ${visible === 1 ? 'resposta encontrada' : 'respostas encontradas'}`;
    empty.hidden = visible !== 0;
  });
})();
