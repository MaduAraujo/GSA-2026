import { errorMessage } from '../utils/errors';

const BY_CODE = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Seu e-mail ainda não foi confirmado. Abra o link que enviamos para ativar a conta.',
  user_already_exists: 'Já existe uma conta com este e-mail. Entre com sua senha ou use "Esqueceu a senha?".',
  email_exists: 'Já existe uma conta com este e-mail. Entre com sua senha ou use "Esqueceu a senha?".',
  weak_password: 'Essa senha é fraca demais. Use uma combinação mais longa.',
  same_password: 'A nova senha precisa ser diferente da senha atual.',
  session_not_found: 'Sua sessão expirou. Peça um novo link e tente de novo.',
  session_expired: 'Sua sessão expirou. Peça um novo link e tente de novo.',
  otp_expired: 'Este link expirou ou já foi usado. Peça um novo e-mail.',
  over_email_send_rate_limit: 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
  signup_disabled: 'Novos cadastros estão desativados no momento.',
  email_provider_disabled: 'O cadastro por e-mail está desativado no momento.',
  provider_disabled: 'Esse método de login não está disponível no momento.',
  email_address_invalid: 'Esse endereço de e-mail não é válido.',
  email_address_not_authorized: 'Não foi possível enviar e-mail para esse endereço.',
  user_banned: 'Esta conta está bloqueada.',
  user_not_found: 'Não encontramos uma conta com esse e-mail.',
} satisfies Record<string, string>;

const CODE_LOOKUP: Record<string, string | undefined> = BY_CODE;

const BY_MESSAGE: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already (been )?registered/i, BY_CODE.user_already_exists],
  [/after (\d+) seconds?/i, (m) => `Por segurança, aguarde ${m[1]} segundos antes de tentar de novo.`],
  [/rate limit/i, BY_CODE.over_request_rate_limit],
  [/provider is not enabled|unsupported provider/i, BY_CODE.provider_disabled],
  [/signups? not allowed/i, BY_CODE.signup_disabled],
  [/password should be at least (\d+)/i, (m) => `A senha precisa ter pelo menos ${m[1]} caracteres.`],
  [/should be different from the old password/i, BY_CODE.same_password],
  [/unable to validate email address|invalid format/i, BY_CODE.email_address_invalid],
  [/failed to fetch|networkerror|load failed/i, 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'],
];

export function authErrorCode(err: unknown): string | undefined {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

export function isEmailNotConfirmed(err: unknown): boolean {
  return authErrorCode(err) === 'email_not_confirmed' || /email not confirmed/i.test(errorMessage(err, ''));
}

export function friendlyAuthError(err: unknown, fallback: string): string {
  const message = errorMessage(err, fallback);
  for (const [pattern, text] of BY_MESSAGE) {
    const match = message.match(pattern);
    if (match) return typeof text === 'string' ? text : text(match);
  }
  const code = authErrorCode(err);
  const mapped = code ? CODE_LOOKUP[code] : undefined;
  if (mapped) return mapped;
  if (code === 'validation_failed') return fallback;
  return message;
}
