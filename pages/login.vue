<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
    
    <!-- ❄️ Snowfall Canvas Effect -->
    <canvas ref="snowCanvas" class="fixed inset-0 pointer-events-none z-10"></canvas>

    <!-- 🎵 Floating Audio Player Widget -->
    <div class="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2.5 transition-all hover:border-red-500/50 group w-72 sm:w-80">
      <audio ref="audioRef" :src="currentTrack.url" @ended="nextTrack" loop={false}></audio>
      
      <!-- Top Track Info & Select Box -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <span v-if="isPlaying" class="w-2 h-2 rounded-full bg-green-400 animate-ping shrink-0"></span>
          <span v-else class="w-2 h-2 rounded-full bg-slate-500 shrink-0"></span>
          <select 
            v-model="currentTrackIndex" 
            @change="changeTrack"
            class="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-red-500 truncate w-full cursor-pointer"
          >
            <option v-for="(track, index) in playlist" :key="index" :value="index">
              {{ index + 1 }}. {{ track.title }}
            </option>
          </select>
        </div>
        <span class="text-[10px] text-slate-400 font-medium shrink-0">{{ Math.round(volume * 100) }}%</span>
      </div>

      <!-- Controls & Volume -->
      <div class="flex items-center gap-3">
        <!-- Playback Buttons -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            @click="prevTrack" 
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition text-xs cursor-pointer"
            title="เพลงก่อนหน้า"
          >
            ⏮️
          </button>

          <button 
            @click="toggleMusic" 
            class="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg shadow-red-600/30 cursor-pointer"
            :title="isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'"
          >
            <span v-if="isPlaying" class="text-sm">⏸️</span>
            <span v-else class="text-sm animate-pulse">🎵</span>
          </button>

          <button 
            @click="nextTrack" 
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition text-xs cursor-pointer"
            title="เพลงถัดไป"
          >
            ⏭️
          </button>
        </div>

        <!-- Volume Slider -->
        <div class="flex-1">
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
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative z-20 backdrop-blur-xs">
      
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

      <!-- Login Form -->
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

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

// Audio & Playlist State
const audioRef = ref(null)
const isPlaying = ref(false)
const volume = ref(0.3)
const currentTrackIndex = ref(0)

// 🎵 รายชื่อเพลงทั้งหมด (สามารถเพิ่ม/ลดลิงก์เพลงตรงนี้ได้เลย)
const playlist = ref([
  {
    title: 'ลื้อ ลื้อ',
    url: 'https://cdn.discordapp.com/attachments/1531701261689294999/1553646892108480542/Y2Mate.is_-_-_Kakagoesbackhome__Official_Audio_.mp3?ex=6aba01ec&is=6ab8b06c&hm=b52eb2bac01f8e66ea765f177bda1d31d0654393c829aa98eee14b8ccbce5c77&'
  },
  {
    title: 'ไม่ได้อยากจะเลวหรอก',
    url: 'https://cdn.discordapp.com/attachments/1531701261689294999/1553655873870503976/Z9_PAWA_COVER_REMIX.mp3?ex=6aba0a49&is=6ab8b8c9&hm=cadfdba095f12bfccb20e94ca80d5d109e8e6442bf791f76eb5136c1188b887b&'
  },
  {
    title: 'ไม่รักดีกว่า',
    url: 'https://cdn.discordapp.com/attachments/1531701261689294999/1553656914141905026/Z9_Official_Music_Video.mp3?ex=6aba0b41&is=6ab8b9c1&hm=c3ff0441afb35b7528eea3e726f720c5541c6f88978fd56bdb5da4008a48892f&'
  },
 
])

const currentTrack = computed(() => playlist.value[currentTrackIndex.value] || playlist.value[0])

const toggleMusic = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    playCurrentTrack()
  }
}

const playCurrentTrack = () => {
  if (!audioRef.value) return
  audioRef.value.volume = volume.value
  audioRef.value.play().then(() => {
    isPlaying.value = true
  }).catch(e => console.log('Autoplay prevented:', e))
}

const changeTrack = () => {
  nextTick(() => {
    if (isPlaying.value) {
      playCurrentTrack()
    }
  })
}

const nextTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  changeTrack()
}

const prevTrack = () => {
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

  const numFlakes = 60
  const flakes = []

  for (let i = 0; i < numFlakes; i++) {
    flakes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      d: Math.random() * numFlakes,
      opacity: Math.random() * 0.7 + 0.3,
      speedY: Math.random() * 1 + 0.5,
      speedX: Math.random() * 0.5 - 0.25
    })
  }

  const draw = () => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()

    for (let i = 0; i < numFlakes; i++) {
      const f = flakes[i]
      ctx.moveTo(f.x, f.y)
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true)
    }
    ctx.fill()
    update()
    animationFrameId = requestAnimationFrame(draw)
  }

  const update = () => {
    for (let i = 0; i < numFlakes; i++) {
      const f = flakes[i]
      f.y += f.speedY
      f.x += f.speedX

      if (f.y > height) {
        flakes[i] = {
          x: Math.random() * width,
          y: -10,
          r: f.r,
          d: f.d,
          opacity: f.opacity,
          speedY: f.speedY,
          speedX: f.speedX
        }
      }
    }
  }

  draw()
}

onMounted(() => {
  initSnowfall()
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
  if (!characterName.value.trim() || !phoneNumber.value.trim()) {
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
      .eq('phone_number', phoneNumber.value.trim())
      .single()

    if (error || !profile) {
      throw new Error('ไม่พบข้อมูลสมาชิก หรือชื่อและเบอร์โทรศัพท์ไม่ถูกต้อง')
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