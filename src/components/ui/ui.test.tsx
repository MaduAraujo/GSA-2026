import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Award } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { EmptyState, NoResults } from './EmptyState';
import { Modal, ModalFooter, ModalHeader } from './Modal';
import { PageHeader } from './PageHeader';
import { PageIntro } from './PageIntro';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button');
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Salvar</Button>);
    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('PageHeader', () => {
  it('renders the title as a heading, the subtitle and the actions', () => {
    render(
      <PageHeader icon={Award} title="Certificados" subtitle="3 certificados">
        <Button>Novo</Button>
      </PageHeader>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Certificados' })).toBeInTheDocument();
    expect(screen.getByText('3 certificados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo' })).toBeInTheDocument();
  });

  it('hides an empty subtitle', () => {
    const { container } = render(<PageHeader icon={Award} title="Certificados" subtitle="" />);
    expect(container.querySelector('p')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('runs the call to action', async () => {
    const onClick = vi.fn();
    render(<EmptyState icon={Award} title="Nada aqui" action={{ label: 'Criar', onClick }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('NoResults offers "Limpar filtros" only when it can clear them', async () => {
    const onClear = vi.fn();
    const { rerender } = render(<NoResults />);
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();

    rerender(<NoResults onClear={onClear} />);
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe('Modal', () => {
  function Example({ onClose }: { onClose: () => void }) {
    return (
      <Modal onClose={onClose} labelledBy="example-title">
        <ModalHeader titleId="example-title" title="Novo prazo" onClose={onClose} />
        <input aria-label="Título" />
        <ModalFooter>
          <Button variant="primary">Salvar</Button>
        </ModalFooter>
      </Modal>
    );
  }

  it('is a modal dialog named by its visible heading', () => {
    render(<Example onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Novo prazo' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('closes on Escape and from the header close button', async () => {
    const onClose = vi.fn();
    render(<Example onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps keyboard focus inside the dialog', async () => {
    render(<Example onClose={vi.fn()} />);
    const close = screen.getByRole('button', { name: 'Fechar' });
    expect(close).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
  });
});

describe('PageIntro', () => {
  it('renders the h1 with its id, the tagline and the description', () => {
    render(
      <PageIntro
        icon={Award}
        headingId="intro-heading"
        title="Precisa de ajuda?"
        tagline="Fale conosco"
        description="Texto"
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Precisa de ajuda?' })).toHaveAttribute('id', 'intro-heading');
    expect(screen.getByText('Fale conosco')).toBeInTheDocument();
    expect(screen.getByText('Texto')).toBeInTheDocument();
  });
});
