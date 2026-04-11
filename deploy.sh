#!/bin/bash
set -e

echo "🔍 Type-checking..."
npx tsc --noEmit

echo "🔨 Building..."
npx vercel build --prod

echo "🚀 Deploying to wavebound.ai..."
npx vercel deploy --prebuilt --prod

echo "✅ Live at https://wavebound.ai"
