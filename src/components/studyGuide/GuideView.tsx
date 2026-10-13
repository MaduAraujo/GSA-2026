import { BadgeCheck, FileDown, Presentation, ShieldAlert } from 'lucide-react';
import { BRAND_MANUAL_URL, COMPLIANCE_RULES, EVENT_STEPS, TEMPLATES, VALIDATION_RULES } from './guideContent';
import { LinkButton } from './QuickAccessBar';

const cardClass = 'bg-white rounded-3xl border border-gray-200 shadow-xs p-5 sm:p-6';

export function GuideView() {
  return (
    <div className="space-y-5">
      <section aria-labelledby="guide-steps-heading" className={cardClass}>
        <h3 id="guide-steps-heading" className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Presentation className="w-5 h-5 text-[#1A73E8]" />
          Passo a passo de eventos
        </h3>
        <p className="mt-1 text-sm text-gray-500">Sessões presenciais de 30 a 60 minutos, em 6 etapas.</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 p-4 rounded-2xl bg-[#F8FAFD] border border-gray-100">
              <span
                aria-hidden="true"
                className="w-8 h-8 shrink-0 rounded-full bg-[#1A73E8] text-white text-sm font-bold flex items-center justify-center"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{step.title}</p>
                <p className="mt-0.5 text-sm text-gray-600 leading-relaxed wrap-break-word">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="guide-rules-heading" className={`${cardClass} border-[#34A853]/30`}>
          <h3 id="guide-rules-heading" className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-[#34A853]" />
            Regras de validação
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EA4335]/10 text-[#D93025]">
              Obrigatório
            </span>
          </h3>
          <p className="mt-1 text-sm text-gray-500">Sem estes critérios, o evento não conta pontos.</p>
          <ul className="mt-4 space-y-2.5">
            {VALIDATION_RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#34A853]" />
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="guide-compliance-heading" className={`${cardClass} border-[#FBBC04]/40`}>
          <h3 id="guide-compliance-heading" className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#F9AB00]" />
            Limites de atuação e conformidade
          </h3>
          <p className="mt-1 text-sm text-gray-500">Como representar o programa e usar a marca.</p>
          <ul className="mt-4 space-y-2.5">
            {COMPLIANCE_RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-[#F9AB00]" />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="guide-templates-heading" className={cardClass}>
        <h3 id="guide-templates-heading" className="text-base font-bold text-gray-900 flex items-center gap-2">
          <FileDown className="w-5 h-5 text-[#EA4335]" />
          Modelos oficiais
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {TEMPLATES.map((template) => (
            <LinkButton key={template.url} href={template.url} label={template.label} />
          ))}
          <LinkButton href={BRAND_MANUAL_URL} label="Manual da Marca" />
        </div>
      </section>
    </div>
  );
}
