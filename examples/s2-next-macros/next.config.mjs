import macrosPlugin from 'unplugin-parcel-macros';

// Create a single instance of the plugin that's shared between server and client builds.
let macrosWebpack = macrosPlugin.webpack();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.VERDACCIO && process.env.CIRCLE_SHA1 ? `/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/s2-next-macros` : "",
  webpack(config, {}) {
    config.plugins.push(macrosWebpack);

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  }
};

export default nextConfig;
