import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Configurar padrões de imagens remotas para Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'achfuhpvowyolkbayocd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Redirects de rotas legacy
  async redirects() {
    return [
      // Redirect antigo /shortlist/:token → /:tenantSlug/shortlists/:token
      // Note: Sem tenant slug, precisaria resolver dinamicamente via middleware
      {
        source: '/shortlist/:token',
        destination: '/404',
        permanent: false,
      },
      // Redirect antigo formato de vaga (dead route)
      {
        source: '/vagas/link/:jobId',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/:tenantSlug/vagas/link/:jobId',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/:tenantSlug/vaga/:jobId',
        destination: '/404',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;

