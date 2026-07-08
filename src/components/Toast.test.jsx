import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';

describe('Toast', () => {
  it('affiche le message et l\'icône de succès', () => {
    render(<Toast type="success" message="Pilote enregistré" onClose={() => {}} />);
    expect(screen.getByText('Pilote enregistré')).toBeInTheDocument();
  });

  it('appelle onClose au clic sur le bouton de fermeture', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Toast type="error" message="Erreur" onClose={onClose} />);

    await user.click(screen.getByLabelText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
