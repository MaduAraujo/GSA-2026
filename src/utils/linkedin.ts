import type { Certificate } from '../types';
import { isHttpUrl } from './safeUrl';

const ADD_TO_PROFILE_URL = 'https://www.linkedin.com/profile/add';

export function linkedInAddCertificationUrl(cert: Certificate): string {
  const params = new URLSearchParams({ startTask: 'CERTIFICATION_NAME', name: cert.title });
  if (cert.issuer) params.set('organizationName', cert.issuer);

  const [year, month] = (cert.issueDate ?? '').split('-');
  if (year && month) {
    params.set('issueYear', year);
    params.set('issueMonth', String(Number(month)));
  }
  if (isHttpUrl(cert.credentialUrl)) params.set('certUrl', cert.credentialUrl!);
  if (cert.credentialId) params.set('certId', cert.credentialId);

  return `${ADD_TO_PROFILE_URL}?${params}`;
}
