import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  it('renders headings, lists, code blocks and inline formatting', () => {
    const { container } = render(
      <MarkdownText
        text={
          '# Título\n\nTexto com **negrito**, *itálico* e `código`.\n\n1. Um\n2. Dois\n\n- A\n- B\n\n```\nconst x = 1;\n```'
        }
      />,
    );
    expect(screen.getByText('Título')).toHaveClass('font-bold');
    expect(screen.getByText('negrito').tagName).toBe('STRONG');
    expect(screen.getByText('itálico').tagName).toBe('EM');
    expect(screen.getByText('código').tagName).toBe('CODE');
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.querySelector('pre')).toHaveTextContent('const x = 1;');
  });

  it('links only http(s) URLs and never injects raw HTML', () => {
    const { container } = render(
      <MarkdownText text={'[site](https://example.com) [xss](javascript:alert(1)) <img src=x onerror=alert(1)>'} />,
    );
    expect(screen.getByRole('link', { name: 'site' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.queryByRole('link', { name: 'xss' })).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});
