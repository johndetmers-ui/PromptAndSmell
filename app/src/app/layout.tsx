import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Prompt & Smell - Generative Olfaction Platform",
  description:
    "Type a prompt, get a scent. AI-powered fragrance generation from natural language descriptions.",
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
                <h3 className="text-lg font-bold gradient-text mb-3">
                  Prompt & Smell
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                  The world&apos;s first generative olfaction platform.
                  Transform natural language into precise scent formulas
                  using the Open Scent Code standard.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Platform
                </h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <a href="/create" className="hover:text-primary-400 transition-colors">
                      Create
                    </a>
                  </li>
                  <li>
                    <a href="/gallery" className="hover:text-primary-400 transition-colors">
                      Gallery
                    </a>
                  </li>
                  <li>
                    <a href="/docs" className="hover:text-primary-400 transition-colors">
                      Documentation
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Resources
                </h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <a href="/docs" className="hover:text-primary-400 transition-colors">
                      OSC Specification
                    </a>
                  </li>
                  <li>
                    <a href="/docs" className="hover:text-primary-400 transition-colors">
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a href="/docs" className="hover:text-primary-400 transition-colors">
                      Hardware Guide
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-surface-700/20 text-center text-xs text-gray-600">
              Prompt & Smell -- Generative Olfaction Platform.
              Built on the Open Scent Code standard.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
