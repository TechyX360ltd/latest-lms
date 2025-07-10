export async function uploadToCloudinary(file: File, folder = 'lms-media') {
  const url = `https://api.cloudinary.com/v1_1/dx9hdygy3/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'techyx360lms'); // Replace with your unsigned preset
  formData.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  return res.json(); // Contains .secure_url
} 