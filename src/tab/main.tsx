import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(
  <StrictMode>
    <div className="min-h-screen p-6">
      <h1 className="text-xl font-semibold">Snipworth (full tab)</h1>
      <p className="text-ink-muted">Boot OK</p>
    </div>
  </StrictMode>,
);
