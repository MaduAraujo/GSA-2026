import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { makeChallenge, makePost, makeProfile } from './test/factories';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const { authMocks, storage } = vi.hoisted(() => {
  const authMocks = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const storage = {
    getCertificates: vi.fn(),
    getPrompts: vi.fn(),
    getPromptDocs: vi.fn(),
    getPosts: vi.fn(),
    getChallenges: vi.fn(),
    getGalleryPhotos: vi.fn(),
    getSessions: vi.fn(),
    getWeeklyScores: vi.fn(),
    getReferenceLinks: vi.fn(),
    getProgramDeadlines: vi.fn(),
    getProfile: vi.fn(),
    getUserBadges: vi.fn(),
    saveCertificate: vi.fn().mockResolvedValue(undefined),
    deleteCertificate: vi.fn().mockResolvedValue(undefined),
    savePrompt: vi.fn().mockResolvedValue(undefined),
    deletePrompt: vi.fn().mockResolvedValue(undefined),
    savePromptDoc: vi.fn().mockResolvedValue(undefined),
    deletePromptDoc: vi.fn().mockResolvedValue(undefined),
    savePost: vi.fn().mockResolvedValue(undefined),
    deletePost: vi.fn().mockResolvedValue(undefined),
    saveChallenge: vi.fn().mockResolvedValue(undefined),
    deleteChallenge: vi.fn().mockResolvedValue(undefined),
    saveGalleryPhoto: vi.fn().mockResolvedValue(undefined),
    deleteGalleryPhoto: vi.fn().mockResolvedValue(undefined),
    saveSession: vi.fn().mockResolvedValue(undefined),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    saveWeeklyScore: vi.fn().mockResolvedValue(undefined),
    deleteWeeklyScore: vi.fn().mockResolvedValue(undefined),
    saveReferenceLink: vi.fn().mockResolvedValue(undefined),
    deleteReferenceLink: vi.fn().mockResolvedValue(undefined),
    saveProgramDeadline: vi.fn().mockResolvedValue(undefined),
    deleteProgramDeadline: vi.fn().mockResolvedValue(undefined),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    unlockBadge: vi.fn().mockResolvedValue(undefined),
  };
  return { authMocks, storage };
});

vi.mock('./services/supabaseClient', () => ({
  supabase: { auth: authMocks },
  getAuthHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock('./services/supabaseStorage', () => ({ SupabaseStorageService: storage }));

function mockLoggedOut() {
  authMocks.getSession.mockResolvedValue({ data: { session: null } });
  authMocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
}

function mockLoggedIn() {
  const session = { user: { id: 'user-1' }, access_token: 'token' };
  authMocks.getSession.mockResolvedValue({ data: { session } });
  authMocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  storage.getCertificates.mockResolvedValue([]);
  storage.getPrompts.mockResolvedValue([]);
  storage.getPromptDocs.mockResolvedValue([]);
  storage.getPosts.mockResolvedValue([]);
  storage.getChallenges.mockResolvedValue([]);
  storage.getGalleryPhotos.mockResolvedValue([]);
  storage.getSessions.mockResolvedValue([]);
  storage.getWeeklyScores.mockResolvedValue([]);
  storage.getReferenceLinks.mockResolvedValue([]);
  storage.getProgramDeadlines.mockResolvedValue([]);
  storage.getProfile.mockResolvedValue(makeProfile({ name: 'Ana Souza' }));
  storage.getUserBadges.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  );
  storage.saveCertificate.mockResolvedValue(undefined);
  storage.deleteCertificate.mockResolvedValue(undefined);
  storage.savePrompt.mockResolvedValue(undefined);
  storage.savePost.mockResolvedValue(undefined);
  storage.deletePost.mockResolvedValue(undefined);
  storage.saveChallenge.mockResolvedValue(undefined);
  storage.saveProfile.mockResolvedValue(undefined);
  storage.unlockBadge.mockResolvedValue(undefined);
});

describe('App — authentication gate', () => {
  it('shows the public home page when there is no active session', async () => {
    mockLoggedOut();
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('shows the auth screen after clicking Entrar', async () => {
    mockLoggedOut();
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Entre para acessar seus dados')).toBeInTheDocument();
  });

  it('renders the dashboard once a session is present', async () => {
    mockLoggedIn();
    render(<App />);
    expect(await screen.findByText('Olá, Ana Souza')).toBeInTheDocument();
    await waitFor(() => expect(storage.getCertificates).toHaveBeenCalledTimes(1));
  });

  it('signs out through Supabase when Sair da conta is clicked', async () => {
    mockLoggedIn();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Olá, Ana Souza');

    await user.click(screen.getByLabelText('Abrir menu da conta'));
    await user.click(screen.getByText('Sair da conta'));
    expect(authMocks.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('App — dashboard tab switching', () => {
  it('shows only the active tab content and switches when a nav item is clicked', async () => {
    mockLoggedIn();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Olá, Ana Souza');

    expect(await screen.findByText('Nenhum certificado encontrado', {}, { timeout: 5000 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Prompts' }));
    expect(await screen.findByText('Nenhum prompt encontrado', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});

describe('App — data loading and consolidation', () => {
  it('merges duplicate posts linked to the same challenge into one on load', async () => {
    const survivor = makePost({ id: 'post-1', platform: 'LinkedIn', publishedUrl: 'https://linkedin.com/a' });
    const duplicate = makePost({ id: 'post-2', platform: 'Instagram', publishedUrl: 'https://instagram.com/a' });
    const challenge = makeChallenge({ id: 'ch-1', linkedPostIds: ['post-1', 'post-2'] });

    mockLoggedIn();
    storage.getPosts.mockResolvedValue([survivor, duplicate]);
    storage.getChallenges.mockResolvedValue([challenge]);

    render(<App />);
    await screen.findByText('Olá, Ana Souza');

    await waitFor(() => expect(storage.deletePost).toHaveBeenCalledWith('post-2'));
    expect(storage.savePost).toHaveBeenCalledWith(expect.objectContaining({ id: 'post-1' }));
    expect(storage.saveChallenge).toHaveBeenCalledWith(expect.objectContaining({ linkedPostIds: ['post-1'] }));
  });
});

describe('App — badges', () => {
  it('unlocks a badge and shows the toast after an action crosses a threshold', async () => {
    mockLoggedIn();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Olá, Ana Souza');
    await screen.findByText('Nenhum certificado encontrado');

    await user.click(screen.getByLabelText('Novo certificado'));
    screen.getByRole('dialog');
    await user.type(document.getElementById('cert-form-title') as HTMLInputElement, 'Meu certificado');
    storage.getCertificates.mockResolvedValue([
      { id: 'c1', title: 'Meu certificado', issuer: 'Google', issueDate: '2026-01-01', category: 'Cloud', description: '', skills: [], hours: 1, minutes: 0, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(storage.unlockBadge).toHaveBeenCalledWith('first_certificate'));
    expect(await screen.findByText('Badge desbloqueada!')).toBeInTheDocument();
  });
});
