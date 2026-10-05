# Adapted visual components

- Globe3D.tsx adapts the scene, Earth textures, atmosphere and orbit controls from [Aceternity UI's 3D Globe](https://ui.aceternity.com/components/3d-globe). CloudFire adds monochrome shading, local assets, lazy loading, idle rendering and a static fallback. No avatar or location markers are shown.
- GoogleGeminiEffect.tsx and geminiPaths.ts adapt [Aceternity UI's Google Gemini Effect](https://ui.aceternity.com/components/google-gemini-effect). CloudFire keeps the supplied curves, uses its existing Framer Motion runtime, and adds its palette and playback preferences.
- Earth assets are the reference component's NASA Blue Marble and topology maps, supplied through the three-globe example assets.