import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /*VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Turfics - Book Your Game',
        short_name: 'Turfics',
        description: 'Premium turf booking and tournament management app',
        theme_color: '#00e676',
        icons: [
          {
            src: 'turfics-logo.png', // Using existing logo as placeholder, ideally explicitly sized icons
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'turfics-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })*/
  ],
})
