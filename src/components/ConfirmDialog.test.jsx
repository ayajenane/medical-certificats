import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it("n'affiche rien quand open est false", () => {
    render(<ConfirmDialog open={false} title="Supprimer" message="Êtes-vous sûr ?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
  });

  it('affiche le titre et le message quand open est true', () => {
    render(<ConfirmDialog open title="Supprimer le pilote" message="Cette action est irréversible." onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Supprimer le pilote')).toBeInTheDocument();
    expect(screen.getByText('Cette action est irréversible.')).toBeInTheDocument();
  });

  it('appelle onConfirm au clic sur le bouton de confirmation', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="Supprimer" message="?" confirmLabel="Supprimer" onConfirm={onConfirm} onCancel={() => {}} />);

    await user.click(screen.getByText('Supprimer', { selector: 'button' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel au clic sur le bouton annuler', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="Titre" message="?" onConfirm={() => {}} onCancel={onCancel} />);

    await user.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
