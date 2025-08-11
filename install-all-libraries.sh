#!/bin/bash
# Install all SkyStage libraries

echo "Installing all required libraries..."
bun add react@^18.3.1 \
  react-dom@^18.3.1 \
  next@^15.3.2 \
  typescript@^5.0.0 \
  tailwindcss@^3.4.0 \
  framer-motion@^11.0.0 \
  @radix-ui/react-* \
  lucide-react@^0.469.0 \
  clsx@^2.1.1 \
  three@^0.179.0 \
  @types/three@^0.179.0 \
  @react-three/fiber@^9.3.0 \
  @react-three/drei@^10.6.1 \
  cloudinary@^2.0.0 \
  @cloudinary/react@^1.0.0 \
  @cloudinary/url-gen@^1.0.0 \
  gsap@^3.12.0 \
  lottie-web@^5.12.0 \
  aos@^2.3.4 \
  react-hook-form@^7.54.0 \
  zod@^3.24.0 \
  @hookform/resolvers@^3.10.0 \
  axios@^1.11.0 \
  date-fns@^4.2.0 \
  uuid@^11.0.0 \
  crypto-js@^4.2.0

echo "Installing dev dependencies..."
bun add -D @types/react @types/node eslint prettier

echo "✅ All libraries installed!"
