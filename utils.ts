export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const processUrlImage = async (url: string): Promise<{ base64: string; mimeType: string }> => {
  const response = await fetch(url);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  // Default to jpeg if type is missing, but usually blob.type is reliable
  return { base64, mimeType: blob.type || 'image/jpeg' };
};

// Resize image to reduce token usage and latency. 
// Skips resizing for GIFs to preserve animation.
export const resizeImage = (file: File, maxWidth = 800): Promise<{ url: string; base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    // If it's a GIF, do not resize via canvas as it kills the animation.
    if (file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({
          url: result,
          base64: result.split(',')[1],
          mimeType: 'image/gif'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        // Don't upscale
        const width = img.width > maxWidth ? maxWidth : img.width;
        const height = img.width > maxWidth ? img.height * ratio : img.height;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        
        resolve({
          url: dataUrl,
          base64: base64,
          mimeType: 'image/jpeg'
        });
      };
    };
    reader.onerror = reject;
  });
};
