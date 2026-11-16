import { describe, expect, it } from 'vitest';
import { makeCertificate } from '../test/factories';
import { linkedInAddCertificationUrl } from './linkedin';

const paramsOf = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe('linkedInAddCertificationUrl', () => {
  it('fills every field LinkedIn accepts', () => {
    const url = linkedInAddCertificationUrl(
      makeCertificate({
        title: 'Google Cloud Digital Leader',
        issuer: 'Google Cloud',
        issueDate: '2026-03-15',
        credentialId: 'ABC-123',
        credentialUrl: 'https://verify.example/abc',
      }),
    );
    expect(url.startsWith('https://www.linkedin.com/profile/add?')).toBe(true);
    expect(paramsOf(url)).toEqual({
      startTask: 'CERTIFICATION_NAME',
      name: 'Google Cloud Digital Leader',
      organizationName: 'Google Cloud',
      issueYear: '2026',
      issueMonth: '3',
      certId: 'ABC-123',
      certUrl: 'https://verify.example/abc',
    });
  });

  it('leaves out empty or unsafe fields', () => {
    const params = paramsOf(
      linkedInAddCertificationUrl(
        makeCertificate({ issuer: '', issueDate: '', credentialId: undefined, credentialUrl: 'javascript:alert(1)' }),
      ),
    );
    expect(params).not.toHaveProperty('organizationName');
    expect(params).not.toHaveProperty('issueYear');
    expect(params).not.toHaveProperty('certId');
    expect(params).not.toHaveProperty('certUrl');
  });
});
