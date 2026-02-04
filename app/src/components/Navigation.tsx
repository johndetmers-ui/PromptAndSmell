"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const moduleColors: Record<string, string> = {
  Atmosphere: "#F59E0B",
  Scent: "#10B981",
  Texture: "#3B82F6",
  Taste: "#EC4899",
  Pulse: "#EF4444",
};

const navLinks = [
  { href: "/create", label: "Create" },
  { href: "/atmosphere", label: "Atmosphere" },
  { href: "/scent", label: "Scent" },
  { href: "/texture", label: "Texture" },
  { href: "/taste", label: "Taste" },
  { href: "/pulse", label: "Pulse" },
  { href: "/gallery", label: "Gallery" },
  { href: "/docs", label: "Docs" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-strong shadow-glass py-3"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Abstract synesthesia icon -- overlapping colored circles */}
            <div className="relative w-7 h-7 mr-2">
              <div
                className="absolute top-0 left-0 w-4 h-4 rounded-full opacity-70"
                style={{ background: "#F59E0B" }}
              />
              <div
                className="absolute top-1 left-2.5 w-4 h-4 rounded-full opacity-70"
                style={{ background: "#10B981" }}
              />
              <div
                className="absolute top-3 left-1 w-4 h-4 rounded-full opacity-70"
                style={{ background: "#3B82F6" }}
              />
            </div>
            <span className="text-lg font-bold text-gray-100 tracking-tight">
              Synesthesia
            </span>
            <span className="text-lg font-bold text-primary-400 tracking-tight">
              .ai
            </span>
          </motion.div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const dotColor = moduleColors[link.label];
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {dotColor && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                  )}
                  <span
                    className={
                      isActive
                        ? "text-primary-400"
                        : "text-gray-400 hover:text-gray-200"
                    }
                  >
                    {link.label}
                  </span>
                </span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-400 rounded-full"
                    layoutId="nav-indicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="hidden lg:block">
          <Link href="/create" className="btn-primary text-sm py-2 px-4">
            Create Experience
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 top-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Menu panel */}
            <motion.div
              className="lg:hidden fixed top-0 right-0 bottom-0 w-72 z-50 bg-surface-900 border-l border-surface-600/30 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Close button at top */}
              <div className="flex items-center justify-between p-5 border-b border-surface-600/20">
                <span className="text-sm font-bold text-gray-200">
                  Synesthesia
                  <span className="text-primary-400">.ai</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="py-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const dotColor = moduleColors[link.label];
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-primary-400 bg-primary-400/5"
                          : "text-gray-400 hover:text-gray-200 hover:bg-surface-700/30"
                      }`}
                    >
                      {dotColor ? (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                      ) : (
                        <span className="w-2 h-2 flex-shrink-0" />
                      )}
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile CTA */}
              <div className="px-5 pt-4 border-t border-surface-600/20">
                <Link
                  href="/create"
                  className="btn-primary text-sm py-2.5 px-4 w-full block text-center"
                >
                  Create Experience
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
