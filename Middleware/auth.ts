export default defineNuxtRouteMiddleware(async (to) => {
  // @ts-ignore
  const user = useSupabaseUser()

  // ถ้าไม่มี user และไม่ได้อยู่ที่หน้า /login ให้เด้งไปหน้า /login
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // ถ้ามี user แล้ว และพยายามจะเข้าหน้า /login ให้เด้งไปหน้าหลัก /
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})