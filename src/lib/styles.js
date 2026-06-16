const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0a;
    --card-bg: #141414;
    --mid-bg: #1c1c1c;
    --gold: #D4A520;
    --gold-light: #E8C97A;
    --gold-dark: #9A7010;
    --gold-dim: rgba(212,165,32,0.12);
    --gold-border: rgba(212,165,32,0.22);
    --text: #FFFFFF;
    --text-muted: rgba(255,255,255,0.50);
    --text-dim: rgba(255,255,255,0.28);
    --danger: #c04040;
    --success: #2d8a4e;
    --font-head: 'Sora', sans-serif;
    --font-body: 'Inter', sans-serif;
  }
  html { font-size: 16px; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  input, textarea, select, button { font-family: inherit; }
  button { cursor: pointer; border: none; background: none; }
  img { display: block; max-width: 100%; }
  a { color: inherit; text-decoration: none; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--card-bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold-border); border-radius: 2px; }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes toastIn {
    from { transform: translateY(120%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .sheet-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    z-index: 200; animation: fadeIn 0.2s ease;
    backdrop-filter: blur(4px);
  }
  .sheet {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--card-bg);
    border-top: 1px solid var(--gold-border);
    border-radius: 20px 20px 0 0;
    z-index: 201;
    animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
    max-height: 92vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .sheet-handle {
    width: 40px; height: 4px;
    background: var(--gold-border);
    border-radius: 2px;
    margin: 12px auto 0;
  }
  .gold-btn {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
    color: #000;
    font-family: var(--font-head);
    font-weight: 600;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .gold-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .gold-btn:active { transform: translateY(0); }
  .gold-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .ghost-btn {
    background: transparent;
    color: var(--gold);
    border: 1px solid var(--gold-border);
    font-family: var(--font-head);
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  .ghost-btn:hover { background: var(--gold-dim); transform: translateY(-1px); }
  .spinner {
    display: inline-block;
    width: 18px; height: 18px;
    border: 2px solid var(--gold-border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  .badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .badge-gold { background: var(--gold-dim); color: var(--gold); border: 1px solid var(--gold-border); }
  .badge-pending { background: rgba(220,120,20,0.15); color: #E07820; border: 1px solid rgba(220,120,20,0.3); }
  .badge-completed { background: rgba(45,138,78,0.15); color: #4CAF50; border: 1px solid rgba(45,138,78,0.3); }
  .input-field {
    width: 100%;
    background: var(--mid-bg);
    border: 1px solid var(--gold-border);
    border-radius: 10px;
    color: var(--text);
    font-size: 14px;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-dim);
  }
  .input-field::placeholder { color: var(--text-dim); }
  select.input-field option { background: var(--card-bg); }
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--gold-border);
    padding: 0 20px;
    gap: 4px;
    background: var(--card-bg);
  }
  .tab-btn {
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); }
  .qty-control {
    display: flex; align-items: center; gap: 0;
    background: var(--mid-bg);
    border: 1px solid var(--gold-border);
    border-radius: 8px;
    overflow: hidden;
  }
  .qty-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); font-size: 18px; font-weight: 600;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .qty-btn:hover { background: var(--gold-dim); }
  .qty-num {
    min-width: 28px; text-align: center;
    font-size: 14px; font-weight: 600;
    color: var(--text);
  }
  @media (max-width: 600px) {
    .sheet { border-radius: 16px 16px 0 0; }
  }
`;

export default GLOBAL_CSS;
