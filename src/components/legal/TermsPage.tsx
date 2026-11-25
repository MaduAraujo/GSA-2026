import React from 'react';
import { LegalPage, type LegalSection } from './LegalPage';

const SECTIONS: LegalSection[] = [
  {
    title: 'Sobre o serviço',
    body: (
      <p>
        O Hub GSA 2026 é uma ferramenta gratuita para Embaixadores(as) Estudantis organizarem certificados, prompts,
        sessões, desafios e demais registros do programa. É um projeto independente, feito pela comunidade, e não é um
        produto oficial do Google.
      </p>
    ),
  },
  {
    title: 'Sua conta',
    body: (
      <ul>
        <li>Você é responsável por manter seus dados de acesso em segurança.</li>
        <li>As informações cadastradas devem ser verdadeiras e de sua autoria ou com autorização de uso.</li>
        <li>Cada conta é pessoal e não deve ser compartilhada.</li>
      </ul>
    ),
  },
  {
    title: 'Uso adequado',
    body: (
      <>
        <p>Ao usar o Hub, você concorda em não:</p>
        <ul>
          <li>Enviar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros.</li>
          <li>Publicar dados pessoais de outras pessoas sem autorização.</li>
          <li>Tentar acessar contas, dados ou áreas do sistema que não sejam suas.</li>
          <li>Usar o Hub para spam ou para sobrecarregar o serviço de forma intencional.</li>
        </ul>
        <p>Contas que descumprirem estas regras podem ser suspensas ou removidas.</p>
      </>
    ),
  },
  {
    title: 'Seu conteúdo',
    body: (
      <p>
        Tudo o que você adiciona continua sendo seu. Você nos autoriza apenas a armazenar e exibir esse conteúdo para
        prestar o serviço, inclusive no portfólio público, caso você o ative. Você pode editar ou apagar seus registros
        a qualquer momento.
      </p>
    ),
  },
  {
    title: 'Recursos de IA',
    body: (
      <p>
        As sugestões geradas por IA podem conter erros. Revise sempre o resultado antes de usá-lo, especialmente em
        conteúdos públicos.
      </p>
    ),
  },
  {
    title: 'Disponibilidade',
    body: (
      <p>
        Fazemos o possível para manter o Hub no ar e seus dados seguros, mas o serviço é oferecido "como está", sem
        garantia de funcionamento ininterrupto. Recomendamos guardar cópias dos documentos importantes.
      </p>
    ),
  },
  {
    title: 'Privacidade',
    body: (
      <p>
        O tratamento dos seus dados é descrito na{' '}
        <a href="/privacidade" className="font-semibold text-primary hover:underline">
          Política de Privacidade
        </a>
        .
      </p>
    ),
  },
  {
    title: 'Alterações nos termos',
    body: (
      <p>
        Estes termos podem ser atualizados. Ao continuar usando o Hub depois de uma atualização, você concorda com a
        nova versão.
      </p>
    ),
  },
];

export const TermsPage: React.FC = () => (
  <LegalPage
    title="Termos de Uso"
    updatedAt="25 de novembro de 2026"
    intro="Estes termos explicam as regras para usar o Hub GSA 2026. Ao criar uma conta ou entrar no Hub, você concorda com eles."
    sections={SECTIONS}
  />
);
