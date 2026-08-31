import { Certificate, AmbassadorProfile } from '../types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function exportPortfolioAsPdf(profile: AmbassadorProfile, certificates: Certificate[]): void {
  const totalHours = certificates.reduce((acc, c) => acc + (c.hours || 0), 0);
  const sorted = [...certificates].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));

  const certRows = sorted.map((cert) => `
    <div class="cert">
      <div class="cert-header">
        <h3>${escapeHtml(cert.title)}</h3>
        <span class="badge">${escapeHtml(cert.category)}</span>
      </div>
      <p class="meta">${escapeHtml(cert.issuer)} • ${escapeHtml(cert.issueDate)}${cert.hours ? ` • ${cert.hours}h` : ''}</p>
      ${cert.description ? `<p class="desc">${escapeHtml(cert.description)}</p>` : ''}
      ${cert.skills?.length ? `<p class="skills">${cert.skills.map((s) => `#${escapeHtml(s)}`).join('  ')}</p>` : ''}
    </div>
  `).join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Portfólio — ${escapeHtml(profile.name)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #202124; margin: 0; padding: 40px; }
  header { border-bottom: 3px solid #1A73E8; padding-bottom: 20px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  .role { color: #5F6368; font-size: 14px; margin: 0 0 8px; }
  .bio { font-size: 13px; color: #3C4043; max-width: 640px; }
  .stats { display: flex; gap: 24px; margin: 20px 0; }
  .stat { background: #F8F9FA; border: 1px solid #E8EAED; border-radius: 12px; padding: 12px 18px; }
  .stat b { display: block; font-size: 20px; color: #1A73E8; }
  .stat span { font-size: 11px; color: #5F6368; text-transform: uppercase; letter-spacing: 0.04em; }
  .cert { border: 1px solid #E8EAED; border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; page-break-inside: avoid; }
  .cert-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .cert h3 { margin: 0; font-size: 15px; }
  .badge { font-size: 10px; font-weight: 700; background: #1A73E8; color: white; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
  .meta { font-size: 12px; color: #5F6368; margin: 4px 0; }
  .desc { font-size: 12px; color: #3C4043; margin: 6px 0; }
  .skills { font-size: 11px; color: #1A73E8; margin: 4px 0 0; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(profile.name)}</h1>
    <p class="role">${escapeHtml(profile.role)} • ${escapeHtml(profile.university)}</p>
    <p class="bio">${escapeHtml(profile.bio)}</p>
  </header>
  <div class="stats">
    <div class="stat"><b>${certificates.length}</b><span>Certificados</span></div>
    <div class="stat"><b>${totalHours}h</b><span>Horas de estudo</span></div>
  </div>
  <h2>Certificados & Badges</h2>
  ${certRows || '<p>Nenhum certificado cadastrado ainda.</p>'}
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