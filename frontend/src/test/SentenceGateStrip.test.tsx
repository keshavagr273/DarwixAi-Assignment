import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SentenceGateStrip } from '../components/common/SentenceGateStrip';
import { AppProvider } from '../context/AppContext';

const base = { turn_id: 't1', draft_text: 'Unsupported price is 12%', final_spoken_text: 'I will arrange help.' };

describe('SentenceGateStrip', () => {
  it('renders receipt-backed verified claims as spoken', () => {
    render(<AppProvider><SentenceGateStrip gate={{ ...base, status: 'VERIFIED', receipt: {
      citation: 'Policy §4', record_id: 'r1', version: 'v1', score: .9, source_title: 'Policy', source_file: 'p.md', chunk_text: 'text', score_breakdown: { dense: .8, bm25: .8, rerank: .9 },
    }}} /></AppProvider>);
    expect(screen.getByText('Sentence Gate: Verified')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /r1.*v1/i })).toBeInTheDocument();
  });

  it('reveals blocked draft only after the operator requests it', async () => {
    const user = userEvent.setup();
    render(<SentenceGateStrip gate={{ ...base, status: 'BLOCKED_FALLBACK', block_reason: 'No KB evidence' }} />);
    expect(screen.getByText(/Safety Gate Tripped/)).toBeInTheDocument();
    expect(screen.queryByText(/Unsupported price/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view blocked/i }));
    expect(screen.getByText(/Unsupported price/)).toBeInTheDocument();
  });
});
