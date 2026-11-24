// Mock data is rebuilt on every page load. Counter-based ids (instead of random UUIDs)
// come out the same each time, so links like /admin/students/<id> still work after a reload.
let n = 0
export const mockId = () => `5eed0000-0000-4000-8000-${String(++n).padStart(12, '0')}`
