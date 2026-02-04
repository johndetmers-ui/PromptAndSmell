import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Synesthesia.ai -- Multi-Sensory AI Platform",
  description:
    "One prompt, every sense. The first multi-sensory AI platform. Describe an experience and we will bring it to life across sight, sound, scent, touch, and taste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-900 text-gray-200 antialiased">
        <Navigation />
        <main className="pt-20">{children}</main>

        {/* Footer */}
        <footer className="border-t border-surface-700/30 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-lg font-bold mb-3">
                  <span className="text-gray-100">Synesthesia</span>
                  <span className="text-primary-400">.ai</span>
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                  The first multi-sensory AI platform. Transform natural
                  language into complete sensory experiences -- atmosphere,
                  scent, texture, taste, and pulse.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Modules
                </h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <a
                      href="/atmosphere"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Atmosphere
                    </a>
                  </li>
                  <li>
                    <a
                      href="/scent"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Scent
                    </a>
                  </li>
                  <li>
                    <a
                      href="/texture"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Texture
                    </a>
                  </li>
                  <li>
                    <a
                      href="/taste"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Taste
                    </a>
                  </li>
                  <li>
                    <a
                      href="/pulse"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Pulse
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Platform
                </h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <a
                      href="/create"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Create
                    </a>
                  </li>
                  <li>
                    <a
                      href="/gallery"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Gallery
                    </a>
                  </li>
                  <li>
                    <a
                      href="/docs"
                      className="hover:text-primary-400 transition-colors"
                    >
                      Documentation
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-surface-700/20 text-center text-xs text-gray-600">
              Synesthesia.ai -- Multi-Sensory AI Platform.
              One prompt. Every sense.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
