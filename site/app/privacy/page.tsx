import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — tidal-cli",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <a
          href="/"
          className="text-sm text-tidal-gray-400 hover:text-white transition-colors mb-8 inline-block"
        >
          &larr; Back to home
        </a>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-tidal-gray-400 mb-12">
          Last updated: March 16, 2026
        </p>

        <div className="space-y-8 text-tidal-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Overview</h2>
            <p>
              tidal-cli is an open-source command-line tool that lets you
              interact with your Tidal account. It is designed for personal use
              and LLM agent automation. Your privacy is important to us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Data We Collect
            </h2>
            <p>
              <strong className="text-white">tidal-cli does not collect, store, or transmit any personal data to us.</strong>
            </p>
            <p className="mt-3">
              The application communicates directly between your device and
              Tidal&apos;s API servers. No data passes through any intermediary
              server operated by us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Authentication
            </h2>
            <p>
              tidal-cli uses OAuth 2.0 Authorization Code flow with PKCE to
              authenticate with Tidal. Your credentials are never seen or stored
              by tidal-cli. Authentication tokens are stored locally on your
              device at <code className="text-tidal-cyan text-sm bg-tidal-gray-800 px-1.5 py-0.5 rounded">~/.tidal-cli/session.json</code> and
              are never transmitted to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Data Storage
            </h2>
            <p>
              All data is stored locally on your device:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>OAuth tokens in <code className="text-tidal-cyan text-sm bg-tidal-gray-800 px-1.5 py-0.5 rounded">~/.tidal-cli/session.json</code></li>
              <li>No analytics, telemetry, or tracking</li>
              <li>No cookies on this website (except those set by Tidal during OAuth)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Third-Party Services
            </h2>
            <p>
              tidal-cli communicates with the following services:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>
                <strong className="text-white">Tidal API</strong> (openapi.tidal.com) — to access your music library, playlists, and catalog.
                Subject to{" "}
                <a
                  href="https://tidal.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tidal-cyan hover:underline"
                >
                  Tidal&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-white">Tidal Auth</strong> (login.tidal.com, auth.tidal.com) — for OAuth authentication
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Open Source
            </h2>
            <p>
              tidal-cli is fully open source. You can inspect the source code to
              verify these claims at{" "}
              <a
                href="https://github.com/lucaperret/tidal-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tidal-cyan hover:underline"
              >
                github.com/lucaperret/tidal-cli
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Data Deletion
            </h2>
            <p>
              To remove all locally stored data, delete the session file:
            </p>
            <div className="mt-3 bg-tidal-gray-900 border border-tidal-gray-700 rounded-lg p-4 font-mono text-sm">
              <span className="text-tidal-cyan/50">$ </span>rm -rf ~/.tidal-cli
            </div>
            <p className="mt-3">
              You can also revoke tidal-cli&apos;s access from your Tidal account
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              For questions about this privacy policy, open an issue on{" "}
              <a
                href="https://github.com/lucaperret/tidal-cli/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tidal-cyan hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
