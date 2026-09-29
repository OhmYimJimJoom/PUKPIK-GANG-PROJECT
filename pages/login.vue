<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden select-none">
    
    <!-- 🌌 Background Glow Orbs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- ❄️ Snowfall Canvas Effect -->
    <canvas ref="snowCanvas" class="fixed inset-0 pointer-events-none z-10"></canvas>

    <!-- 🎵 Floating Audio Player Widget -->
    <div class="fixed bottom-5 right-5 z-50 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 hover:border-red-500/60 p-3.5 rounded-2xl shadow-2xl shadow-red-950/30 flex flex-col gap-2.5 transition-all duration-300 group w-72 sm:w-80">
      <audio ref="audioRef" :src="currentTrack?.url" @ended="nextTrack" :loop="false"></audio>
      
      <!-- Top Track Info & Select Box -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <span v-if="isPlaying" class="relative flex h-2 w-2 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span v-else class="w-2 h-2 rounded-full bg-slate-600 shrink-0"></span>
          
          <select 
            v-if="playlist.length > 0"
            v-model="currentTrackIndex" 
            @change="changeTrack"
            class="bg-slate-950/80 text-xs text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 truncate w-full cursor-pointer transition"
          >
            <option v-for="(track, index) in playlist" :key="track.id || index" :value="index">
              {{ index + 1 }}. {{ track.title }}
            </option>
          </select>
          <span v-else class="text-xs text-slate-500 italic truncate">
            {{ isFetchingPlaylist ? 'กำลังโหลดเพลง...' : 'ไม่มีเพลงในระบบ' }}
          </span>
        </div>
        <span class="text-[10px] font-mono text-slate-400 shrink-0">{{ Math.round(volume * 100) }}%</span>
      </div>

      <!-- Controls & Volume -->
      <div class="flex items-center gap-3">
        <!-- Playback Buttons -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            @click="prevTrack" 
            :disabled="playlist.length === 0"
            class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 flex items-center justify-center transition text-xs cursor-pointer border border-slate-700/40"
            title="เพลงก่อนหน้า"
          >
            ⏮️
          </button>

          <button 
            @click="toggleMusic" 
            :disabled="playlist.length === 0"
            class="w-9 h-9 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 disabled:opacity-50 text-white flex items-center justify-center transition shadow-lg shadow-red-600/30 cursor-pointer"
            :title="isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'"
          >
            <span v-if="isPlaying" class="text-xs">⏸️</span>
            <span v-else class="text-xs animate-pulse">🎵</span>
          </button>

          <button 
            @click="nextTrack" 
            :disabled="playlist.length === 0"
            class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 flex items-center justify-center transition text-xs cursor-pointer border border-slate-700/40"
            title="เพลงถัดไป"
          >
            ⏭️
          </button>
        </div>

        <!-- Volume Slider -->
        <div class="flex-1 flex items-center">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            v-model.number="volume" 
            @input="updateVolume"
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>
    </div>

    <!-- Login Box Container -->
    <div class="max-w-md w-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/80 space-y-6 relative z-20 group hover:border-slate-700/80 transition-all duration-500">
      
      <!-- Top Neon Status Bar -->
      <div class="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase pb-2 border-b border-slate-800/60">
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          PUKPIK SECURE ACCESS
        </span>
        <span class="text-red-500/80 font-bold">VER 2.0</span>
      </div>

      <!-- Logo & Title -->
      <div class="text-center space-y-3">
        <div class="relative w-24 h-24 mx-auto group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-0 bg-red-600/30 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
          <div 
            class="relative w-full h-full rounded-2xl shadow-xl border-2 border-red-500/60 bg-cover bg-center shrink-0 overflow-hidden" 
            style="background-image: url('/img/541F17CF-F73E-4E4C-A209-D750B423A3F1.png');"
          ></div>
        </div>

        <div>
          <h1 class="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-red-400 drop-shadow-sm">
            PUKPIK GANG
          </h1>
          <p class="text-xs text-slate-400 mt-1">ระบบเข้าสู่ระบบสำหรับสมาชิกภายในแก๊งเท่านั้น</p>
        </div>
      </div>

      <!-- Error Message Alert -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
        <div v-if="errorMessage" class="bg-red-950/50 border border-red-500/50 text-red-300 text-xs p-3 rounded-xl text-center flex items-center justify-center gap-2 shadow-inner">
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
      </transition>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-300 tracking-wide uppercase">ชื่อในเมือง (Character Name)</label>
          <div class="relative">
            <input 
              v-model="characterName" 
              type="text" 
              required 
              placeholder="เช่น GIORNO LECLAIR"
              class="w-full bg-slate-950/70 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-300 tracking-wide uppercase">รหัสผ่าน (Password)</label>
          <div class="relative">
            <input 
              v-model="username" 
              type="password" 
              required 
              placeholder="เริ่มต้นจะเป็นเบอร์โทร เช่น 973146"
              class="w-full bg-slate-950/70 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full relative group/btn overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/30 flex justify-center items-center gap-2 mt-4 cursor-pointer"
        >
          <!-- Shiny Animated Gradient Hover -->
          <span class="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></span>
          
          <span v-if="isLoading" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังตรวจสอบข้อมูล...
          </span>
          <span v-else class="tracking-wider uppercase text-sm">เข้าสู่ระบบ</span>
        </button>
      </form>

      <!-- Footer Info -->
      <div class="text-center pt-2">
        <p class="text-[11px] text-slate-500">AUTHORIZED MEMBERS ONLY</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

definePageMeta({
  layout: false
})

const client = useSupabaseClient()
const router = useRouter()
const store = useGangStore()

const characterName = ref('')
const username = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Audio & Playlist State
const audioRef = ref(null)
const isPlaying = ref(false)
const volume = ref(0.3)
const currentTrackIndex = ref(0)
const playlist = ref([])
const isFetchingPlaylist = ref(false)

const currentTrack = computed(() => {
  if (playlist.value.length === 0) return null
  return playlist.value[currentTrackIndex.value] || playlist.value[0]
})

// 🎵 โหลดรายการเพลงจาก Supabase Database และลองเล่นอัตโนมัติ
const fetchPlaylist = async () => {
  isFetchingPlaylist.value = true
  try {
    const { data, error } = await client
      .from('playlist')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    if (data && data.length > 0) {
      playlist.value = data
      // เมื่อดึงข้อมูลเพลงเสร็จ ให้เริ่มเล่นเพลงแรกทันที
      nextTick(() => {
        attemptAutoplay()
      })
    } else {
      playlist.value = []
    }
  } catch (err) {
    console.error('Fetch playlist error on login page:', err)
  } finally {
    isFetchingPlaylist.value = false
  }
}

// ฟังก์ชั่นพยายามเล่นเพลงอัตโนมัติ (พร้อม fallback รองรับกฎเบราว์เซอร์)
const attemptAutoplay = () => {
  if (!audioRef.value || playlist.value.length === 0) return
  audioRef.value.volume = volume.value
  
  audioRef.value.play().then(() => {
    isPlaying.value = true
  }).catch(() => {
    // กรณีโดนเบราว์เซอร์บล็อก autoplay: ดักการคลิกครั้งแรกของผู้ใช้เพื่อเล่นเพลง
    const handleFirstUserInteraction = () => {
      if (audioRef.value && !isPlaying.value) {
        audioRef.value.play().then(() => {
          isPlaying.value = true
        }).catch(e => console.log('Autoplay play failed:', e))
      }
      window.removeEventListener('click', handleFirstUserInteraction)
      window.removeEventListener('keydown', handleFirstUserInteraction)
    }

    window.addEventListener('click', handleFirstUserInteraction)
    window.addEventListener('keydown', handleFirstUserInteraction)
  })
}

const toggleMusic = () => {
  if (!audioRef.value || playlist.value.length === 0) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    playCurrentTrack()
  }
}

const playCurrentTrack = () => {
  if (!audioRef.value || playlist.value.length === 0) return
  audioRef.value.volume = volume.value
  audioRef.value.play().then(() => {
    isPlaying.value = true
  }).catch(e => console.log('Playback error:', e))
}

const changeTrack = () => {
  nextTick(() => {
    playCurrentTrack()
  })
}

const nextTrack = () => {
  if (playlist.value.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  changeTrack()
}

const prevTrack = () => {
  if (playlist.value.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  changeTrack()
}

const updateVolume = () => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
}

// Snowfall Engine (Canvas)
const snowCanvas = ref(null)
let animationFrameId = null

const initSnowfall = () => {
  const canvas = snowCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  
  let width = canvas.width = window.innerWidth
  let height = canvas.height = window.innerHeight

  const handleResize = () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)

  const numFlakes = 75
  const flakes = []

  for (let i = 0; i < numFlakes; i++) {
    flakes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.7 + 0.2,
      speedY: Math.random() * 1.2 + 0.4,
      speedX: Math.random() * 0.6 - 0.3,
      swing: Math.random() * 0.02
    })
  }

  const draw = () => {
    ctx.clearRect(0, 0, width, height)

    for (let i = 0; i < numFlakes; i++) {
      const f = flakes[i]
      ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true)
      ctx.fill()
    }
    update()
    animationFrameId = requestAnimationFrame(draw)
  }

  const update = () => {
    for (let i = 0; i < numFlakes; i++) {
      const f = flakes[i]
      f.y += f.speedY
      f.x += f.speedX + Math.sin(f.y * f.swing) * 0.3

      if (f.y > height) {
        flakes[i] = {
          x: Math.random() * width,
          y: -10,
          r: f.r,
          opacity: f.opacity,
          speedY: f.speedY,
          speedX: f.speedX,
          swing: f.swing
        }
      }
    }
  }

  draw()
}

onMounted(() => {
  initSnowfall()
  fetchPlaylist()
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

const handleLogin = async () => {
  if (!characterName.value.trim() || !username.value.trim()) {
    errorMessage.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('character_name', characterName.value.trim())
      .eq('username', username.value.trim())
      .single()

    if (error || !profile) {
      throw new Error('ไม่พบข้อมูลสมาชิก หรือชื่อและ Password ไม่ถูกต้อง')
    }

    if (process.client) {
      localStorage.setItem('gang_user_session', JSON.stringify(profile))
    }

    if (store.setCurrentUser) {
      store.setCurrentUser(profile)
    }

    if (store.fetchAllData) {
      await store.fetchAllData()
    }

    await router.push('/')
  } catch (err) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
  } finally {
    isLoading.value = false
  }
}
</script>