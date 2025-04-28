import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom'
const { createRoot } = ReactDOM
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
