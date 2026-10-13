import React from 'react';
import { ScrollText } from 'lucide-react';

interface ListBlock {
  title?: string;
  lead?: string;
  items: string[];
}

interface Section {
  title: string;
  intro?: string;
  lists: ListBlock[];
  outro?: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Respeito vem primeiro',
    intro:
      'A comunidade deve ser um espaço seguro para aprender, perguntar, compartilhar ideias e conhecer novas pessoas. Por isso:',
    lists: [
      {
        items: [
          'Trate todas as pessoas com respeito;',
          'Contribua para conversas construtivas e colaborativas;',
          'Evite provocações, ofensas, ataques pessoais ou comportamentos hostis;',
          'Não são tolerados assédio, bullying, discriminação ou qualquer forma de desrespeito;',
          'Mantenha os grupos oficiais focados nos assuntos relacionados ao programa e à experiência universitária.',
        ],
      },
    ],
    outro: [
      'Comportamentos graves que comprometam a segurança e o respeito dentro da comunidade podem levar ao desligamento do programa.',
    ],
  },
  {
    title: 'Privacidade',
    intro: 'Proteja os seus dados e os de outras pessoas, tanto nos grupos, quanto nas atividades do programa:',
    lists: [
      {
        items: [
          'Não compartilhe telefones, e-mails, conversas privadas ou outros dados pessoais de terceiros;',
          'Não publique prints que exponham informações sensíveis;',
          'Não utilize os dados de contato disponíveis nos grupos para abordagens privadas sem autorização;',
          'Dúvidas gerais devem ser feitas nos canais da comunidade, evitando mensagens privadas aos Team Leaders;',
          'Informações internas, métricas e decisões estratégicas compartilhadas pelo programa devem permanecer dentro dos canais oficiais.',
        ],
      },
    ],
  },
  {
    title: 'Compartilhe com responsabilidade',
    intro:
      'As redes sociais são um ótimo espaço para dividir aprendizados, conquistas e experiências do programa. Na hora de publicar ou criar conteúdos, vale cuidar da privacidade das pessoas, da autoria dos materiais e da forma como o programa é representado.',
    lists: [
      {
        title: '✅ Pode compartilhar',
        items: [
          'aprendizados e experiências com o Google Gemini;',
          'prompts, dicas, hacks e estratégias que possam ajudar outras pessoas;',
          'selos, conquistas e marcos oficiais da jornada;',
          'conteúdos autorais relacionados a IA, estudos, carreira e projetos;',
          'prints de interações com o Gemini, desde que não exponham dados pessoais ou informações sensíveis;',
          'ações gratuitas, grupos de estudo, workshops e outras iniciativas realizadas no campus.',
        ],
      },
      {
        title: '❌ Deve ficar fora das redes',
        items: [
          'métricas, decisões, bastidores ou informações confidenciais do programa;',
          'prints ou conteúdos de conversas dos grupos oficiais;',
          'fotos, vídeos, nomes ou dados de outras pessoas sem autorização;',
          'materiais de terceiros apresentados como se fossem de autoria própria;',
          'conteúdos ofensivos, hostis ou que incentivem rivalidades entre participantes, grupos ou universidades;',
          'publicações que possam sugerir vínculo empregatício com Google ou Amplifica;',
          'uso inadequado da marca Google ou fora do contexto do programa.',
        ],
      },
      {
        title: '✨ Na hora de criar',
        items: [
          'priorize conteúdos autorais ou materiais que tenha autorização para utilizar;',
          'respeite direitos autorais e propriedade intelectual;',
          'confira se imagens, vídeos e prints não revelam informações pessoais de outras pessoas;',
          'dê os créditos necessários sempre que utilizar referências ou conteúdos de terceiros.',
        ],
      },
    ],
    outro: [
      'Os conteúdos produzidos e compartilhados dentro do programa também seguem os termos de uso de imagem, voz e direitos autorais aceitos no ingresso na jornada.',
    ],
  },
  {
    title: 'Participação também faz parte do combinado',
    intro: 'A participação no programa é voluntária e educacional.',
    lists: [],
    outro: [
      'Fazer parte do Programa Embaixadores Estudantis Google não cria vínculo empregatício, estágio, prestação de serviços ou qualquer tipo de contratação com Google ou Amplifica.',
      'Ao compartilhar essa experiência em currículos ou redes profissionais, ela deve ser apresentada de forma transparente como uma experiência de participação ou liderança voluntária.',
      'E sim: participar do programa é totalmente compatível com outros cursos, estágios, bolsas, projetos e oportunidades acadêmicas ou profissionais.',
    ],
  },
  {
    title: 'O que pode levar ao desligamento?',
    intro:
      'Para garantir a segurança, o respeito mútuo e a harmonia de toda a comunidade, a coordenação do programa acompanha de perto o cumprimento das regras e do Código de Conduta. Existem dois caminhos principais que podem levar ao desligamento ou à perda do status de embaixador(a):',
    lists: [
      {
        title: '1. Infrações aos termos e diretrizes de participação no programa e regras de privacidade',
        lead: 'Mantemos uma política de tolerância zero contra comportamentos que violem a ética, a diversidade e a integridade da nossa rede. As infrações abaixo resultam no desligamento imediato e definitivo, com revogação de acessos e benefícios do programa:',
        items: [
          '**Assédio, bullying e discriminação:** qualquer ato, discurso ou manifestação de assédio, discriminação, bullying ou desrespeito com colegas, team leaders ou membros da equipe.',
          '**Ofensas e ataques:** ataques pessoais, xingamentos ou interações agressivas nos canais oficiais.',
          '**Violação de privacidade e uso indevido de dados:** o compartilhamento não autorizado de fotos pessoais (rostos) de terceiros ou vazamento de dados de participantes.',
          '**Divulgação de informações confidenciais:** compartilhamento externo ou em redes sociais de métricas internas ou materiais estratégicos do Programa.',
          '**Uso inadequado dos canais:** divulgação recorrente de spam, correntes, propagandas, vendas de produtos ou links de grupos externos não relacionados ao programa.',
        ],
      },
      {
        title: '2. Inatividade prolongada (falta de engajamento)',
        lead: 'Como a participação na comunidade exige envolvimento ativo em ciclos móveis de 30 dias, o desligamento também pode ocorrer de forma automática por inatividade prolongada:',
        items: [
          '**Status não-ativo:** se o(a) embaixador(a) passar 30 dias consecutivos sem registrar nenhuma evidência válida de interação (como assistir a masterclasses ou comprovar o uso de prompts) com pelo menos um check-in mensal de atividades, ele(a) é colocado(a) automaticamente no status "Não-Ativo" e seus acessos a mentorias e suporte operacional são congelados.',
          '**Desligamento definitivo:** caso o status "Não-Ativo" persista por 45 dias consecutivos, a equipe de gestão realizará o desligamento definitivo do/a Embaixador(a).',
        ],
      },
    ],
  },
];

function renderInline(text: string) {
  const match = /^\*\*(.+?)\*\*\s*(.*)$/.exec(text);
  if (!match) return text;
  return (
    <>
      <strong className="font-semibold text-gray-900 dark:text-gray-100">{match[1]}</strong> {match[2]}
    </>
  );
}

function ListBlockView({ block }: { block: ListBlock }) {
  return (
    <div className="mt-5">
      {block.title && (
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">{block.title}</h3>
      )}
      {block.lead && <p className="mt-2 leading-relaxed text-gray-600 dark:text-gray-300">{block.lead}</p>}
      <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-[#1A73E8]">
        {block.items.map((item) => (
          <li key={item} className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const GuidelinesPage: React.FC = () => (
  <article aria-labelledby="guidelines-heading" className="max-w-3xl mx-auto space-y-6">
    <header className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-10">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8]/10">
        <ScrollText className="h-6 w-6 text-[#1A73E8]" />
      </div>
      <h1
        id="guidelines-heading"
        className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900 dark:text-gray-100"
      >
        Combinados que fazem a diferença para a nossa comunidade funcionar bem
      </h1>
      <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
        Para que a experiência do Programa de Embaixadores Estudantis Google seja segura, respeitosa e positiva para
        todo mundo, alguns combinados precisam acompanhar a jornada do início ao fim. Vale conhecer, respeitar e ajudar
        a fortalecer essas boas práticas:
      </p>
    </header>

    {SECTIONS.map((section) => (
      <section
        key={section.title}
        aria-label={section.title}
        className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
      >
        <h2 className="text-lg font-bold uppercase tracking-tight text-[#1A73E8]">{section.title}</h2>
        {section.intro && <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{section.intro}</p>}
        {section.lists.map((block, i) => (
          <ListBlockView key={block.title ?? i} block={block} />
        ))}
        {section.outro?.map((text) => (
          <p key={text} className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
            {text}
          </p>
        ))}
      </section>
    ))}
  </article>
);
