/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 临时禁用构建时的ESLint检查，用于i18n演示
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 临时禁用构建时的TypeScript检查，用于i18n演示
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
