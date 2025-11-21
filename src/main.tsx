import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reatomContext } from '@reatom/npm-react'
import { createCtx } from '@reatom/framework';

export const reatomCtx = createCtx();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <reatomContext.Provider value={reatomCtx}>
          <App />
      </reatomContext.Provider>
  </StrictMode>,
)
