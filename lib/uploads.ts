// URL of an uploaded image, served by app/api/uploads/[name]/route.ts
export function uploadUrl(fileName: string) {
  return `/api/uploads/${fileName}`;
}
