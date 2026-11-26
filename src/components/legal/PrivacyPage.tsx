import React from 'react';
import { LegalPage, type LegalSection } from './LegalPage';

const SECTIONS: LegalSection[] = [
  {
    title: 'Quais dados coletamos',
    body: (
      <>
        <ul>
          <li>
            <strong>Dados da conta:</strong> seu e-mail e, se você entrar com o Google, também o nome e a foto do seu
            perfil Google. Quando você cria uma senha, ela é guardada apenas de forma criptografada.
          </li>
          <li>
            <strong>Conteúdo que você adiciona:</strong> certificados, badges, prompts, posts, sessões, desafios, fotos,
            vídeos e demais registros que você mesmo(a) cadastra no Hub.
          </li>
          <li>
            <strong>Dados técnicos:</strong> informações necessárias para manter você conectado(a) e, se você ativar, a
            inscrição para receber notificações no navegador.
          </li>
        </ul>
        <p>Não coletamos dados de pagamento nem vendemos qualquer informação.</p>
      </>
    ),
  },
  {
    title: 'Como usamos os dados',
    body: (
      <ul>
        <li>Permitir que você entre na sua conta e acesse seus registros.</li>
        <li>Exibir seu progresso, estatísticas e conquistas dentro do Hub.</li>
        <li>Enviar lembretes e notificações, somente se você as ativar.</li>
        <li>Gerar sugestões com IA quando você usa recursos como a melhoria de prompts.</li>
        <li>Identificar e corrigir erros técnicos do sistema.</li>
      </ul>
    ),
  },
  {
    title: 'Login com o Google',
    body: (
      <p>
        Ao entrar com o Google, recebemos apenas seu nome, e-mail e foto de perfil, com o seu consentimento. Não
        acessamos seu Gmail, Drive, contatos ou qualquer outro dado da sua conta Google. O uso dessas informações segue
        a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.
      </p>
    ),
  },
  {
    title: 'Com quem compartilhamos',
    body: (
      <>
        <p>Usamos alguns serviços para o Hub funcionar. Eles tratam os dados apenas para prestar esse serviço:</p>
        <ul>
          <li>
            <strong>Supabase:</strong> autenticação, banco de dados e armazenamento dos arquivos.
          </li>
          <li>
            <strong>Vercel:</strong> hospedagem do site.
          </li>
          <li>
            <strong>Groq:</strong> processamento dos textos enviados aos recursos de IA, apenas quando você os usa.
          </li>
          <li>
            <strong>Sentry:</strong> registro de erros técnicos, identificado só por um código interno da conta.
          </li>
          <li>
            <strong>Have I Been Pwned:</strong> ao criar uma senha, verificamos se ela já apareceu em vazamentos
            enviando apenas um trecho do seu código criptografado, nunca a senha.
          </li>
        </ul>
        <p>
          Seu portfólio só fica visível para outras pessoas se você mesmo(a) ativar o portfólio público, e apenas os
          itens que você escolher exibir aparecem nele.
        </p>
      </>
    ),
  },
  {
    title: 'Segurança e armazenamento',
    body: (
      <p>
        Os dados trafegam com criptografia (HTTPS) e ficam protegidos por regras de acesso que permitem que cada pessoa
        veja apenas o próprio conteúdo. Arquivos privados são acessados por links temporários. Mantemos seus dados
        enquanto sua conta estiver ativa.
      </p>
    ),
  },
  {
    title: 'Seus direitos',
    body: (
      <>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você pode pedir acesso, correção ou exclusão dos seus
          dados, além de revogar o consentimento a qualquer momento.
        </p>
        <p>
          Você pode editar ou apagar seus registros diretamente no Hub. Para excluir a conta inteira, com todos os
          registros e arquivos, use Configurações → Excluir minha conta. Você também pode remover o acesso do Hub à sua
          conta Google em myaccount.google.com/permissions.
        </p>
      </>
    ),
  },
  {
    title: 'Alterações nesta política',
    body: (
      <p>
        Esta política pode ser atualizada para refletir mudanças no Hub. A data no topo da página indica a versão mais
        recente.
      </p>
    ),
  },
];

export const PrivacyPage: React.FC = () => (
  <LegalPage
    title="Política de Privacidade"
    updatedAt="25 de novembro de 2026"
    intro="O Hub GSA 2026 ajuda Embaixadores(as) Estudantis a organizar a própria jornada no programa. Esta política explica quais dados usamos, por quê e como você controla essas informações."
    sections={SECTIONS}
  />
);
