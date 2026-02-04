"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/create", label: "Create" },
  { href: "/gallery", label: "Gallery" },
  { href: "/docs", label: "Docs" },
  { href: "/profile", label: "Profile" },
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
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Droplets className="w-6 h-6 text-primary-400" />
          </motion.div>
          <span className="text-lg font-bold gradient-text tracking-tight">
            Prompt & Smell
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
              >
                <span
                  className={
                    isActive
                      ? "text-primary-400"
                      : "text-gray-400 hover:text-gray-200"
                  }
                >
                  {link.label}
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
        <div className="hidden md:block">
          <Link href="/create" className="btn-primary text-sm py-2 px-4">
            New Scent
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          className="md:hidden glass-strong mt-2 mx-4 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-5 py-3 text-sm font-medium border-b border-surface-600/20 transition-colors ${
                  isActive
                    ? "text-primary-400 bg-primary-400/5"
                    : "text-gray-400 hover:text-gray-200 hover:bg-surface-700/30"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </motion.div>
      )}
    </nav>
  );
}
