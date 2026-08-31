import { PromptItem } from '../types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function exportPromptsAsPdf(prompts: PromptItem[]): void {
  const sorted = [...prompts].sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));

  const rows = sorted.map((p) => `
    <div class="prompt">
      <div class="prompt-header">
        <h3>${escapeHtml(p.title)}</h3>
        <span class="badge">${escapeHtml(p.section)}</span>
      </div>
      ${p.description ? `<p class="desc">${escapeHtml(p.description)}</p>` : ''}
      <pre class="text">${escapeHtml(p.promptText)}</pre>
      ${p.tags?.length ? `<p class="tags">${p.tags.map((t) => `#${escapeHtml(t)}`).join('  ')}</p>` : ''}
    </div>
  `).join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Banco de Prompts — Embaixadora Google 2026</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #202124; margin: 0; padding: 40px; }
  header { border-bottom: 3px solid #FBBC04; padding-bottom: 20px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  .subtitle { color: #5F6368; font-size: 13px; margin: 0; }
  .prompt { border: 1px solid #E8EAED; border-radius: 12px; padding: 16px 18px; margin-bottom: 14px; page-break-inside: avoid; }
  .prompt-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .prompt h3 { margin: 0; font-size: 15px; }
  .badge { font-size: 10px; font-weight: 700; background: #FBBC04; color: #202124; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
  .desc { font-size: 12px; color: #3C4043; margin: 6px 0; }
  .text { font-size: 11px; color: #202124; background: #F8F9FA; border-radius: 8px; padding: 10px 12px; white-space: pre-wrap; font-family: 'Consolas', monospace; margin: 8px 0; }
  .tags { font-size: 11px; color: #1A73E8; margin: 4px 0 0; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <header>
    <h1>Banco de Prompts</h1>
    <p class="subtitle">${prompts.length} prompt${prompts.length === 1 ? '' : 's'} exportado${prompts.length === 1 ? '' : 's'} • Embaixadora Estudantil Google 2026</p>
  </header>
  ${rows || '<p>Nenhum prompt selecionado.</p>'}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Não foi possível abrir a janela de exportação. Verifique se o bloqueador de pop-ups está desativado.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}