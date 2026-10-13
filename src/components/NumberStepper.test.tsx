import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NumberStepper } from './NumberStepper';

function Controlled({ initial = 0, max, onValue }: { initial?: number; max?: number; onValue?: (n: number) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <NumberStepper
        id="points"
        value={value}
        max={max}
        onChange={(n) => {
          setValue(n);
          onValue?.(n);
        }}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

const input = () => screen.getByRole('spinbutton') as HTMLInputElement;

describe('NumberStepper', () => {
  it('lets the 0 be deleted, leaving the field empty while typing', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(input());
    await user.keyboard('{Backspace}');
    expect(input()).toHaveValue('');
    expect(screen.getByTestId('value')).toHaveTextContent('0');
  });

  it('replaces the 0 instead of producing a leading zero', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(input());
    await user.keyboard('25');
    expect(input()).toHaveValue('25');
    expect(screen.getByTestId('value')).toHaveTextContent('25');

    await user.clear(input());
    await user.type(input(), '07');
    expect(input()).toHaveValue('7');
  });

  it('steps with the keyboard arrows, and by 10 with Shift', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={5} />);
    await user.click(input());
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(input()).toHaveValue('7');
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input()).toHaveValue('17');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('value')).toHaveTextContent('16');
  });

  it('never goes below the minimum with the arrow keys or the minus button', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={1} />);
    await user.click(input());
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input()).toHaveValue('0');
    await user.click(screen.getByRole('button', { name: 'Diminuir' }));
    expect(input()).toHaveValue('0');
    await user.click(screen.getByRole('button', { name: 'Aumentar' }));
    expect(input()).toHaveValue('1');
  });

  it('ignores non-digits and caps at the maximum', async () => {
    const user = userEvent.setup();
    render(<Controlled max={59} />);
    await user.clear(input());
    await user.type(input(), '4a-');
    expect(input()).toHaveValue('4');
    await user.type(input(), '5');
    expect(input()).toHaveValue('45');
    await user.type(input(), '9');
    expect(input()).toHaveValue('59');
  });

  it('restores the minimum when the field is left empty', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled initial={8} onValue={onValue} />);
    await user.clear(input());
    await user.tab();
    expect(input()).toHaveValue('0');
    expect(screen.getByTestId('value')).toHaveTextContent('0');
  });
});
