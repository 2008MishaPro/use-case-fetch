import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reatomContext } from '@reatom/npm-react'
import { createCtx } from '@reatom/framework';

const ctx = createCtx();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <reatomContext.Provider value={ctx}>
          <App />
      </reatomContext.Provider>
  </StrictMode>,
)
