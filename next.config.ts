import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ეს უზრუნველყოფს, რომ პროექტი არ აირიოს სხვა ფაილებთან
    // და მუშაობს სტაბილურად
  },
};

export default nextConfig;
