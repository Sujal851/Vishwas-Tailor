// src/utils/downloadImage.js
//
// Securely downloads an image URL to the user's device.
// Uses fetch -> blob -> temporary <a download> instead of a raw
// `<a href="...">` link, because:
//  - it works consistently across mobile browsers (a plain href to an
//    image often just opens/previews it instead of saving it)
//  - it lets us force a clean, predictable filename
//  - the blob URL is local/object-scoped and is revoked immediately
//    after use, so nothing lingers in memory
//
// Returns true on success, false on failure (caller decides how to notify).
export async function downloadImage(url, filename) {
  if (!url) return false;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'bill-photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Free the object URL once the browser has had a chance to start the download
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    return true;
  } catch (err) {
    console.error('Photo download error:', err);
    return false;
  }
}

// Builds a friendly filename from an order's bill number / id and the
// original extension in the stored URL, e.g. "bill-1042.jpg"
export function billPhotoFilename(url, billNo) {
  const ext = (url?.split('.').pop() || 'jpg').split('?')[0].slice(0, 5);
  const base = billNo ? `bill-${billNo}` : 'bill-photo';
  return `${base}.${ext}`;
}