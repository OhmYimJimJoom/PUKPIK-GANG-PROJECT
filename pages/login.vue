<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
      
      <!-- Logo & Title -->
      <div class="text-center space-y-2">
       <div 
  class="w-20 h-20 rounded-lg shadow-lg shadow-red-600/40 border border-red-500/50 bg-cover bg-center shrink-0 mx-auto" 
  style="background-image: url('/img/541F17CF-F73E-4E4C-A209-D750B423A3F1.png');"
></div>
        <h1 class="text-2xl font-extrabold tracking-wider text-white">PUKPIK GANG</h1>
        <p class="text-xs text-slate-400">ระบบเข้าสู่ระบบสำหรับสมาชิกภายในแก๊งเท่านั้น</p>
      </div>

      <!-- Error Message Alert -->
      <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
        {{ errorMessage }}
      </div>

      <!-- Login Form (ใช้ Character Name + Phone Number) -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">ชื่อในเมือง (Character Name)</label>
          <input 
            v-model="characterName" 
            type="text" 
            required 
            placeholder="ใช้ชื่อในเมืองเช่น GIORNO LECLAIR"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">เบอร์โทรศัพท์ (Phone Number)</label>
          <input 
            v-model="phoneNumber" 
            type="text" 
            required 
            placeholder="ใช้เบอร์ในเมืองเช่น 973146"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-600/30 flex justify-center items-center gap-2 mt-2 cursor-pointer"
        >
          <span v-if="isLoading">กำลังเข้าสู่ระบบ...</span>
          <span v-else>เข้าสู่ระบบ</span>
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
  layout: false
})

const client = useSupabaseClient()
const router = useRouter()
const store = useGangStore()

const characterName = ref('')
const phoneNumber = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!characterName.value.trim() || !phoneNumber.value.trim()) {
    errorMessage.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. ตรวจสอบข้อมูลสมาชิกจากตาราง profiles
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('character_name', characterName.value.trim())
      .eq('phone_number', phoneNumber.value.trim())
      .single()

    if (error || !profile) {
      throw new Error('ไม่พบข้อมูลสมาชิก หรือชื่อและเบอร์โทรศัพท์ไม่ถูกต้อง')
    }

    // 2. บันทึก Session ลงใน LocalStorage
    if (process.client) {
      localStorage.setItem('gang_user_session', JSON.stringify(profile))
    }

    // 3. อัปเดตข้อมูลเข้า Store (หากมีฟังก์ชันสำหรับเก็บ User ใน Store)
    if (store.setCurrentUser) {
      store.setCurrentUser(profile)
    }

    if (store.fetchAllData) {
      await store.fetchAllData()
    }

    // 4. เปลี่ยนหน้าไปยัง Dashboard
    await router.push('/')
  } catch (err) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
  } finally {
    isLoading.value = false
  }
}
</script>