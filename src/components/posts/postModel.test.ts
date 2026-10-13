import { describe, expect, it } from 'vitest';
import { makePost } from '../../test/factories';
import {
  canSavePost,
  finalizePost,
  getPostCopyText,
  getPostDisplayDate,
  getPostLinks,
  getPostPlatforms,
} from './postModel';

describe('postModel', () => {
  it('shows the challenge date from the first content line for challenge posts', () => {
    const post = makePost({ tone: 'Resultado de Desafio', content: '05/10/2026\nhttps://x.com' });
    expect(getPostDisplayDate(post)).toBe('05/10/2026');
  });

  it('falls back to the legacy publishedUrl when there are no social links', () => {
    const post = makePost({ platform: 'Instagram', publishedUrl: 'https://instagram.com/p/1', socialLinks: undefined });
    expect(getPostLinks(post)).toEqual([{ id: 'legacy', platform: 'Instagram', link: 'https://instagram.com/p/1' }]);
  });

  it('lists each platform once even with several links on it', () => {
    const post = makePost({
      socialLinks: [
        { id: '1', platform: 'LinkedIn', link: 'https://a' },
        { id: '2', platform: 'LinkedIn', link: 'https://b' },
        { id: '3', platform: 'Whatsapp', link: 'https://c' },
      ],
    });
    expect(getPostPlatforms(post)).toEqual(['LinkedIn', 'Whatsapp']);
  });

  it('copies the links of a manual post and the text of a written one', () => {
    const manual = makePost({ tone: 'Manual', socialLinks: [{ id: '1', platform: 'LinkedIn', link: 'https://a' }] });
    expect(getPostCopyText(manual)).toBe('https://a');
    expect(getPostCopyText(makePost({ tone: 'Inspirador', content: 'Olá' }))).toBe('Olá');
  });

  it('requires a link for manual posts and text for written ones', () => {
    expect(canSavePost({ title: 'T', status: 'Publicado', tone: 'Manual', socialLinks: [] })).toBe(false);
    expect(canSavePost({ title: 'T', status: 'Publicado', tone: 'Inspirador', content: '' })).toBe(false);
    expect(canSavePost({ title: 'T', status: undefined, tone: 'Inspirador', content: 'x' })).toBe(false);
    expect(canSavePost({ title: 'T', status: 'Rascunho', tone: 'Inspirador', content: 'x' })).toBe(true);
  });

  it('takes a manual post platform and URL from its first link', () => {
    const post = finalizePost({
      title: 'T',
      status: 'Publicado',
      tone: 'Manual',
      platform: 'LinkedIn',
      socialLinks: [{ id: '1', platform: 'Instagram', link: 'https://instagram.com/p/9' }],
    });
    expect(post.platform).toBe('Instagram');
    expect(post.publishedUrl).toBe('https://instagram.com/p/9');
  });
});
