import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/adapters/primary/app/App';
import { composeApp } from '@/infrastructure/bootstrap/composeApp';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

const { errorReader, errorAcknowledger, copySnippetAsImage } = composeApp();

createRoot(root).render(
  <StrictMode>
    <App
      mode="tab"
      errorReader={errorReader}
      errorAcknowledger={errorAcknowledger}
      copySnippetAsImage={copySnippetAsImage}
    />
  </StrictMode>,
);
