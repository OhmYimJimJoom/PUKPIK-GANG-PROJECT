// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss'
  ],

  supabase: {
    redirect: false
  },

  // ใช้โครงสร้างนี้ ตัว Nuxt 3 จะอ่านค่าจาก .env หรือ Vercel Env ให้เองโดยไม่ต้องใช้ process.env
  runtimeConfig: {
    supabaseServiceKey: '', // จะดึงจาก NUXT_SUPABASE_SERVICE_KEY หรือ SUPABASE_SERVICE_KEY ใน Vercel อัตโนมัติ
    public: {
      supabaseUrl: '',
      supabaseKey: ''
    }
  }
})