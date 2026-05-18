import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── Early message capture ────────────────────────────────────────────────
// The BlueBox host may post host:init before our React tree mounts. Attach
// the listener immediately so we don't drop any messages. The hook drains
// this buffer when it runs.
window.__gdvEarlyMessages = []
window.addEventListener('message', (evt) => {
  window.__gdvEarlyMessages.push({
    origin: evt.origin,
    data:   evt.data,
    time:   Date.now(),
  })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
