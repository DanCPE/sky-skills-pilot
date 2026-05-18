import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/api/approximation/questions": ["./src/lib/approximation-engine/**/*.py"],
  },
  rewrites: async () => {
    return [
      {
        source: "/api/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/py/:path*" // Local Python server
            : "/api/", // Vercel Python runtime
      },
    ];
  },
};

export default nextConfig;
