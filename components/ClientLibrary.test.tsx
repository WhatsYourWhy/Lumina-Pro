import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ClientLibrary from './ClientLibrary';
import { createEmptyIntel } from '../lib/persistence';

const brand = { name: 'Acme', industry: 'Logistics', description: '', tone: '' };
const intel = { ...createEmptyIntel(), strategyHistory: [{ type: 'SWOT', timestamp: 't', content: 'c' }] };

const clients = [
  { id: 'a', name: 'Acme', savedAt: '2026-01-01T10:00:00.000Z', brand, intel },
  { id: 'b', name: 'Beta Freight', savedAt: '2026-01-02T10:00:00.000Z', brand: { ...brand, name: 'Beta Freight' }, intel: createEmptyIntel() }
];

describe('ClientLibrary', () => {
  it('shows the active client, its stats, and the saved list', () => {
    render(
      <ClientLibrary
        brand={brand}
        intel={intel}
        clients={clients}
        activeClientId="a"
        onSaveClient={vi.fn()}
        onLoadClient={vi.fn()}
        onDeleteClient={vi.fn()}
        onNewClient={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('In library')).toBeInTheDocument();
    expect(screen.getByText('2 saved')).toBeInTheDocument();
    expect(screen.getByText('Beta Freight')).toBeInTheDocument();
    expect(screen.getByTitle('Load Beta Freight')).toBeInTheDocument();
    expect(screen.queryByTitle('Load Acme')).not.toBeInTheDocument();
  });

  it('wires load, delete, save, and new client actions', () => {
    const onLoad = vi.fn();
    const onDelete = vi.fn();
    const onSave = vi.fn();
    const onNew = vi.fn();

    render(
      <ClientLibrary
        brand={brand}
        intel={intel}
        clients={clients}
        activeClientId={null}
        onSaveClient={onSave}
        onLoadClient={onLoad}
        onDeleteClient={onDelete}
        onNewClient={onNew}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('Not saved')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Load Beta Freight'));
    expect(onLoad).toHaveBeenCalledWith('b');
    fireEvent.click(screen.getByTitle('Delete Acme'));
    expect(onDelete).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByText('Save to library'));
    expect(onSave).toHaveBeenCalled();
    fireEvent.click(screen.getByText('New client'));
    expect(onNew).toHaveBeenCalled();
  });

  it('disables saving until the client has a name', () => {
    render(
      <ClientLibrary
        brand={{ ...brand, name: '' }}
        intel={createEmptyIntel()}
        clients={[]}
        activeClientId={null}
        onSaveClient={vi.fn()}
        onLoadClient={vi.fn()}
        onDeleteClient={vi.fn()}
        onNewClient={vi.fn()}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Save to library').closest('button')).toBeDisabled();
    expect(screen.getByText('No saved clients')).toBeInTheDocument();
  });
});
