import { isSupabaseConfigured } from './lib/supabase'
import './App.css'

function App() {
  return (
    <main className="shell">
      <header>
        <p className="eyebrow">Hackathon template</p>
        <h1>Application</h1>
        <p className="lede">
          React + Vite frontend. Supabase for auth, database, and storage.
        </p>
      </header>

      <section className="panel" aria-labelledby="backend-heading">
        <h2 id="backend-heading">Supabase</h2>
        <p
          className={
            isSupabaseConfigured ? 'status status--ok' : 'status status--warn'
          }
        >
          {isSupabaseConfigured
            ? 'Environment variables are set.'
            : 'Copy .env.example to .env and add your project URL and anon key.'}
        </p>
      </section>

      <section className="panel" aria-labelledby="repo-heading">
        <h2 id="repo-heading">Repo layout</h2>
        <ul>
          <li>
            <code>application/</code> — this app
          </li>
          <li>
            <code>docs/</code> — notes, core, setup
          </li>
          <li>
            <code>data/</code> — datasets (data developer)
          </li>
          <li>
            <code>presentation/</code> — 3D models and graphics
          </li>
        </ul>
      </section>
    </main>
  )
}

export default App
