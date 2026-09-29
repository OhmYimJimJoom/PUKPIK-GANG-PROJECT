<template>
  <div class="min-h-screen bg-neutral-900 text-white flex flex-col justify-between relative overflow-hidden">
    <!-- หน้าต่าง App หลักที่ถูกซ้อนใน Layout -->
    <NuxtPage />

    <!-- Audio Element ซ่อนไว้ที่ Layout หลักเพื่อไม่ให้กระตุกหรือหยุดเมื่อเปลี่ยนหน้า -->
    <audio
      ref="audioRef"
      :src="currentTrack?.url"
      @ended="nextTrack"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// States สำหรับควบคุมเครื่องเล่นเพลง
const audioRef = ref(null)
const playlist = ref([])
const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.5)

// Track ปัจจุบันที่กำลังเลือก
const currentTrack = computed(() => playlist.value[currentTrackIndex.value] || null)

// 1. โหลดข้อมูล เพลย์ลิสต์ จาก API / Supabase
const fetchPlaylist = async () => {
  try {
    const res = await fetch('/api/playlist') // ⚠️ ปรับ endpoint ตามของเดิมที่คุณใช้
    const data = await res.json()
    if (data && Array.isArray(data)) {
      playlist.value = data
    }
  } catch (err) {
    console.error('Error fetching playlist:', err)
  }
}

// 2. ฟังก์ชันสั่งเล่นเพลง
const playTrack = () => {
  if (!audioRef.value || !currentTrack.value?.url) return
  audioRef.value.volume = volume.value

  audioRef.value.play().then(() => {
    isPlaying.value = true
    if (process.client) {
      localStorage.setItem('audio_playing', 'true')
      localStorage.setItem('audio_track_index', currentTrackIndex.value.toString())
    }
  }).catch((err) => {
    console.log('Autoplay blocked or play interrupted:', err)
    isPlaying.value = false

    // หากเบราว์เซอร์บล็อก Autoplay ให้รอคลิกแรกของผู้ใช้เพื่อเล่นต่อทันที
    if (process.client) {
      const handleUserInteraction = () => {
        if (audioRef.value && localStorage.getItem('audio_playing') === 'true') {
          audioRef.value.play().then(() => {
            isPlaying.value = true
          }).catch(e => console.error(e))
        }
        window.removeEventListener('click', handleUserInteraction)
        window.removeEventListener('keydown', handleUserInteraction)
        window.removeEventListener('touchstart', handleUserInteraction)
      }

      window.addEventListener('click', handleUserInteraction)
      window.addEventListener('keydown', handleUserInteraction)
      window.addEventListener('touchstart', handleUserInteraction)
    }
  })
}

// 3. ฟังก์ชันสั่งหยุดเพลง
const pauseTrack = () => {
  if (!audioRef.value) return
  audioRef.value.pause()
  isPlaying.value = false
  if (process.client) {
    localStorage.setItem('audio_playing', 'false')
  }
}

// 4. สลับ เล่น/หยุด
const togglePlay = () => {
  if (isPlaying.value) {
    pauseTrack()
  } else {
    playTrack()
  }
}

// 5. เปลี่ยนเป็นเพลงถัดไป
const nextTrack = () => {
  if (playlist.value.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  if (process.client) {
    localStorage.setItem('audio_track_index', currentTrackIndex.value.toString())
  }
  nextTick(() => {
    playTrack()
  })
}

// 6. เปลี่ยนเป็นเพลงก่อนหน้า
const prevTrack = () => {
  if (playlist.value.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  if (process.client) {
    localStorage.setItem('audio_track_index', currentTrackIndex.value.toString())
  }
  nextTick(() => {
    playTrack()
  })
}

// Event handlers ของ Audio Tag
const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    if (process.client) {
      localStorage.setItem('audio_time', currentTime.value.toString())
    }
  }
}

const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0
  }
}

// ให้ State & Methods แก่คอมโพเนนต์อื่นได้ใช้ร่วมกัน (ผ่าน provide หรือ useState ของ Nuxt)
provide('audioPlayer', {
  playlist,
  currentTrackIndex,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  playTrack,
  pauseTrack,
  togglePlay,
  nextTrack,
  prevTrack
})

// โหลดข้อมูลและคืนสถานะเพลงเมื่อเข้าเว็บครั้งแรก
onMounted(async () => {
  await fetchPlaylist()

  if (process.client) {
    const savedTrackIndex = parseInt(localStorage.getItem('audio_track_index') || '0', 10)
    const savedTime = parseFloat(localStorage.getItem('audio_time') || '0')
    const savedIsPlaying = localStorage.getItem('audio_playing') === 'true'

    if (playlist.value.length > 0 && savedTrackIndex < playlist.value.length) {
      currentTrackIndex.value = savedTrackIndex
    }

    await nextTick()

    if (audioRef.value) {
      audioRef.value.currentTime = savedTime
      if (savedIsPlaying) {
        playTrack()
      }
    }
  }
})
</script>