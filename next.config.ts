import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Pin workspace root to this project so Turbopack ignores the
  // stray package-lock.json in C:\Users\Its_Sensei\.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
