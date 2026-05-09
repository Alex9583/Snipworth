import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/adapters/primary/app/App';
import { composeApp } from '@/infrastructure/bootstrap/composeApp';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

const dependencies = composeApp();

createRoot(root).render(
  <StrictMode>
    <App mode="tab" {...dependencies} />
  </StrictMode>,
);
