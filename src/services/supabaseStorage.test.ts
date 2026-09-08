import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseStorageService } from './supabaseStorage';
import {
  makeCertificate,
  makeChallenge,
  makePost,
  makePrompt,
  makeProfile,
  makeSession,
} from '../test/factories';

const { mockAuth, mockFrom, mockStorageFrom } = vi.hoisted(() => ({
  mockAuth: { getUser: vi.fn() },
  mockFrom: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: mockAuth,
    from: mockFrom,
    storage: { from: mockStorageFrom },
  },
}));

function makeChain(data: unknown, error: unknown = null) {
  const chain: any = {
    then: (resolve: any, reject?: any) => Promise.resolve({ data, error }).then(resolve, reject),
  };
  ['select', 'insert', 'upsert', 'delete', 'eq', 'order'].forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  return chain;
}

function makeStorageBucket(overrides: Partial<Record<'upload' | 'createSignedUrl' | 'remove', any>> = {}) {
  return {
    upload: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example.com/file' } }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

beforeEach(() => {
  mockAuth.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mockFrom.mockReset();
  mockStorageFrom.mockReset().mockReturnValue(makeStorageBucket());
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ blob: async () => new Blob(['fake-bytes'], { type: 'image/png' }) })
  );
});

describe('SupabaseStorageService — profile', () => {
  it('returns a blank profile when no row exists yet', async () => {
    mockFrom.mockReturnValueOnce(makeChain(null));
    const profile = await SupabaseStorageService.getProfile();
    expect(profile).toEqual({ name: '', role: '', university: '', course: '', bio: '', avatarUrl: '', goal2026: '' });
  });

  it('maps a profile row from snake_case to camelCase', async () => {
    mockFrom.mockReturnValueOnce(
      makeChain({
        name: 'Ana',
        role: 'Embaixadora',
        university: 'UFRJ',
        course: 'CC',
        bio: 'Bio',
        avatar_url: 'https://a.png',
        email: 'ana@example.com',
        is_public: true,
        public_slug: 'ana-1234',
      })
    );
    const profile = await SupabaseStorageService.getProfile();
    expect(profile).toMatchObject({
      name: 'Ana',
      avatarUrl: 'https://a.png',
      isPublic: true,
      publicSlug: 'ana-1234',
    });
  });

  it('upserts the profile row with the authenticated user id', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.saveProfile(makeProfile({ name: 'Ana' }));
    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1', name: 'Ana' }));
  });

  it('throws when the row-fetch itself errors', async () => {
    mockFrom.mockReturnValueOnce(makeChain(null, new Error('db down')));
    await expect(SupabaseStorageService.getProfile()).rejects.toThrow('db down');
  });

  it('resolves a public profile by slug', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ id: 'owner-1', name: 'Ana', public_slug: 'ana-1234' }));
    const found = await SupabaseStorageService.getPublicProfileBySlug('ana-1234');
    expect(found).toEqual({ userId: 'owner-1', profile: expect.objectContaining({ name: 'Ana' }) });
  });

  it('returns null when the slug does not match any public profile', async () => {
    mockFrom.mockReturnValueOnce(makeChain(null));
    expect(await SupabaseStorageService.getPublicProfileBySlug('unknown')).toBeNull();
  });
});

describe('SupabaseStorageService — certificates', () => {
  it('maps certificate rows and resolves a signed URL when a file_path is stored', async () => {
    mockFrom.mockReturnValueOnce(
      makeChain([{ id: 'c1', title: 'Cert', issuer: 'Google', issue_date: '2026-01-01', category: 'Cloud', description: '', skills: ['GCP'], file_path: 'user-1/certificates/c1', created_at: '2026-01-01T00:00:00.000Z' }])
    );
    const bucket = makeStorageBucket({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example.com/c1.png' } }) });
    mockStorageFrom.mockReturnValue(bucket);

    const certs = await SupabaseStorageService.getCertificates();
    expect(certs).toHaveLength(1);
    expect(certs[0]).toMatchObject({ id: 'c1', title: 'Cert', fileData: 'https://signed.example.com/c1.png' });
    expect(bucket.createSignedUrl).toHaveBeenCalledWith('user-1/certificates/c1', expect.any(Number));
  });

  it('falls back to the legacy file_data column when there is no file_path', async () => {
    mockFrom.mockReturnValueOnce(
      makeChain([{ id: 'c1', title: 'Cert', issuer: 'Google', issue_date: '2026-01-01', category: 'Cloud', description: '', skills: [], file_data: 'data:image/png;base64,AAA', created_at: '2026-01-01T00:00:00.000Z' }])
    );
    const certs = await SupabaseStorageService.getCertificates();
    expect(certs[0].fileData).toBe('data:image/png;base64,AAA');
  });

  it('uploads a data: URL to storage and stores its path instead of the raw base64', async () => {
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);
    const chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);

    await SupabaseStorageService.saveCertificate(makeCertificate({ id: 'c1', fileData: 'data:image/png;base64,AAA' }));

    expect(bucket.upload).toHaveBeenCalledWith('user-1/certificates/c1', expect.any(Blob), expect.objectContaining({ upsert: true }));
    const savedRow = chain.upsert.mock.calls[0][0];
    expect(savedRow.file_path).toBe('user-1/certificates/c1');
    expect(savedRow.file_data).toBeNull();
  });

  it('does not touch storage when the certificate has no file attached', async () => {
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);
    mockFrom.mockReturnValueOnce(makeChain(null));

    await SupabaseStorageService.saveCertificate(makeCertificate({ fileData: undefined }));
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it('deletes the row and removes the stored file', async () => {
    mockFrom.mockReturnValueOnce(makeChain(null));
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);

    await SupabaseStorageService.deleteCertificate('c1');
    expect(bucket.remove).toHaveBeenCalledWith(['user-1/certificates/c1']);
  });

  it('propagates a delete error and skips removing the file', async () => {
    mockFrom.mockReturnValueOnce(makeChain(null, new Error('delete failed')));
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);

    await expect(SupabaseStorageService.deleteCertificate('c1')).rejects.toThrow('delete failed');
    expect(bucket.remove).not.toHaveBeenCalled();
  });
});

describe('SupabaseStorageService — gallery photos', () => {
  it('maps gallery rows, preferring a signed URL over inline data', async () => {
    mockFrom.mockReturnValueOnce(makeChain([{ id: 'g1', image_path: 'user-1/gallery/g1', caption: 'Foto', category: 'Eventos', created_at: '2026-01-01T00:00:00.000Z' }]));
    const photos = await SupabaseStorageService.getGalleryPhotos();
    expect(photos[0].imageData).toBe('https://signed.example.com/file');
  });

  it('uploads new photo data and clears the inline column', async () => {
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);
    const chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);

    await SupabaseStorageService.saveGalleryPhoto({ id: 'g1', imageData: 'data:image/png;base64,AAA', caption: 'Foto', category: 'Eventos', createdAt: '2026-01-01T00:00:00.000Z' });

    expect(bucket.upload).toHaveBeenCalledWith('user-1/gallery/g1', expect.any(Blob), expect.anything());
    expect(chain.upsert.mock.calls[0][0].image_path).toBe('user-1/gallery/g1');
  });
});

describe('SupabaseStorageService — sessions', () => {
  it('resolves signed URLs for the proof image and each challenge file', async () => {
    mockFrom.mockReturnValueOnce(
      makeChain([
        {
          id: 's1',
          title: 'Sessão',
          session_date: '2026-01-08',
          tool_learned: 'Gemini',
          proof_image_path: 'user-1/sessions/s1/proof',
          challenge_files: [{ id: 'f1', name: 'a.png', fileType: 'image/png', path: 'user-1/sessions/s1/challenge-f1' }],
          created_at: '2026-01-08T00:00:00.000Z',
          updated_at: '2026-01-08T00:00:00.000Z',
        },
      ])
    );
    const sessions = await SupabaseStorageService.getSessions();
    expect(sessions[0].proofImage).toBe('https://signed.example.com/file');
    expect(sessions[0].challengeFiles?.[0].dataUrl).toBe('https://signed.example.com/file');
  });

  it('uploads the proof image and every new challenge file to their own paths', async () => {
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);
    const chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);

    await SupabaseStorageService.saveSession(
      makeSession({
        id: 's1',
        proofImage: 'data:image/png;base64,AAA',
        challengeFiles: [{ id: 'f1', name: 'a.png', fileType: 'image/png', dataUrl: 'data:image/png;base64,BBB' }],
      })
    );

    expect(bucket.upload).toHaveBeenCalledWith('user-1/sessions/s1/proof', expect.any(Blob), expect.anything());
    expect(bucket.upload).toHaveBeenCalledWith('user-1/sessions/s1/challenge-f1', expect.any(Blob), expect.anything());
    const savedRow = chain.upsert.mock.calls[0][0];
    expect(savedRow.challenge_files).toEqual([{ id: 'f1', name: 'a.png', fileType: 'image/png', fileSize: undefined, path: 'user-1/sessions/s1/challenge-f1' }]);
  });

  it('removes the proof image and every attachment path when a session is deleted', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ challenge_files: [{ path: 'user-1/sessions/s1/challenge-f1' }] }))
      .mockReturnValueOnce(makeChain(null));
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);

    await SupabaseStorageService.deleteSession('s1');
    expect(bucket.remove).toHaveBeenCalledWith(['user-1/sessions/s1/proof', 'user-1/sessions/s1/challenge-f1']);
  });
});

describe('SupabaseStorageService — prompts and prompt docs', () => {
  it('maps and saves prompts', async () => {
    mockFrom.mockReturnValueOnce(makeChain([{ id: 'p1', title: 'Prompt', prompt_text: 'Faça X', section: 'Estudos', tags: [], recommended_model: 'gemini-3.7-flash', usage_count: 2, created_at: '2026-01-01T00:00:00.000Z' }]));
    const prompts = await SupabaseStorageService.getPrompts();
    expect(prompts[0]).toMatchObject({ id: 'p1', promptText: 'Faça X', usageCount: 2 });

    const chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.savePrompt(makePrompt({ id: 'p1' }));
    expect(chain.upsert.mock.calls[0][0]).toMatchObject({ id: 'p1', user_id: 'user-1' });
  });

  it('sanitizes the file name before uploading a prompt doc', async () => {
    const bucket = makeStorageBucket();
    mockStorageFrom.mockReturnValue(bucket);
    const file = new File(['conteúdo'], 'meu arquivo (final)!.pdf', { type: 'application/pdf' });

    const path = await SupabaseStorageService.uploadPromptDocFile(file, 'doc-1');

    expect(path).toBe('user-1/doc-1-meu_arquivo__final__.pdf');
    expect(bucket.upload).toHaveBeenCalledWith(path, file, expect.objectContaining({ upsert: true }));
  });

  it('resolves both a view and a download signed URL for a stored prompt doc', async () => {
    const bucket = makeStorageBucket({
      createSignedUrl: vi
        .fn()
        .mockResolvedValueOnce({ data: { signedUrl: 'https://signed.example.com/view' } })
        .mockResolvedValueOnce({ data: { signedUrl: 'https://signed.example.com/download' } }),
    });
    mockStorageFrom.mockReturnValue(bucket);
    mockFrom.mockReturnValueOnce(makeChain([{ id: 'd1', name: 'a.pdf', file_path: 'user-1/d1-a.pdf', file_type: 'application/pdf', created_at: '2026-01-01T00:00:00.000Z' }]));

    const docs = await SupabaseStorageService.getPromptDocs();
    expect(docs[0].fileData).toBe('https://signed.example.com/view');
    expect(docs[0].downloadUrl).toBe('https://signed.example.com/download');
  });
});

describe('SupabaseStorageService — challenges, posts, badges', () => {
  it('derives dates/socialLinks from legacy single-value columns when the array columns are empty', async () => {
    mockFrom.mockReturnValueOnce(
      makeChain([
        {
          id: 'ch1',
          title: 'Desafio',
          status: 'Concluído',
          deadline: '2026-02-01',
          result_link: 'https://example.com/post',
          result_platform: 'LinkedIn',
          linked_post_id: 'post-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ])
    );
    const [challenge] = await SupabaseStorageService.getChallenges();
    expect(challenge.dates).toEqual(['2026-02-01']);
    expect(challenge.socialLinks).toEqual([{ id: 'ch1', platform: 'LinkedIn', link: 'https://example.com/post' }]);
    expect(challenge.linkedPostIds).toEqual(['post-1']);
  });

  it('saves and deletes challenges and posts', async () => {
    let chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.saveChallenge(makeChallenge({ id: 'ch1' }));
    expect(chain.upsert.mock.calls[0][0]).toMatchObject({ id: 'ch1', user_id: 'user-1' });

    chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.deleteChallenge('ch1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'ch1');

    chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.savePost(makePost({ id: 'post-1' }));
    expect(chain.upsert.mock.calls[0][0]).toMatchObject({ id: 'post-1', user_id: 'user-1' });

    chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.deletePost('post-1');
    expect(chain.eq).toHaveBeenCalledWith('id', 'post-1');
  });

  it('unlocks a badge idempotently via onConflict/ignoreDuplicates', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValueOnce(chain);
    await SupabaseStorageService.unlockBadge('first_certificate');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', badge_id: 'first_certificate' }),
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
    );
  });
});

describe('SupabaseStorageService — auth guard', () => {
  it('rejects write operations when there is no authenticated user', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(SupabaseStorageService.saveCertificate(makeCertificate())).rejects.toThrow('Não autenticado.');
  });
});

describe('SupabaseStorageService — export/import', () => {
  it('bundles every entity into one JSON payload', async () => {
    mockFrom.mockImplementation(() => makeChain([]));
    const json = await SupabaseStorageService.exportAllData();
    const parsed = JSON.parse(json);
    expect(parsed).toMatchObject({
      exportVersion: '1.0',
      certificates: [],
      prompts: [],
      posts: [],
      challenges: [],
      galleryPhotos: [],
      sessions: [],
    });
  });

  it('returns false instead of throwing when the backup JSON is invalid', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await SupabaseStorageService.importAllData('not json')).toBe(false);
    consoleSpy.mockRestore();
  });

  it('replays each entity in the backup through its own save method', async () => {
    mockFrom.mockImplementation(() => makeChain(null));
    const backup = JSON.stringify({
      profile: makeProfile(),
      certificates: [makeCertificate({ id: 'c1' })],
      prompts: [makePrompt({ id: 'p1' })],
    });
    expect(await SupabaseStorageService.importAllData(backup)).toBe(true);
    expect(mockFrom).toHaveBeenCalledTimes(3);
  });
});