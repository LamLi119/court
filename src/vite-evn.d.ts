/// <reference types="vite/client" />

/**
 * Vite's built-in client types (provides import.meta.env, asset imports, etc.)
 * This reference is usually enough for most projects.
 */

/* ────────────────────────────────────────────────
   Asset imports as string (URL) – the most common case
   Allows: import logo from '@/assets/green-G.svg'
   ──────────────────────────────────────────────── */
declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

/* ────────────────────────────────────────────────
   Optional: SVG as React component (if you use ?react suffix)
   Example: import Logo from '@/assets/icon.svg?react'
   Requires: npm install -D vite-plugin-svgr
   ──────────────────────────────────────────────── */
// declare module '*.svg?react' {
//   import * as React from 'react';
//   const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
//   export default ReactComponent;
// }

/* ────────────────────────────────────────────────
   Optional: If you want to extend env variables types
   (for VITE_xxx variables in .env files)
   ──────────────────────────────────────────────── */
// interface ImportMetaEnv {
//   readonly VITE_APP_TITLE: string;
//   readonly VITE_API_URL: string;
//   // add more custom env vars here...
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }