// Client-only helper — PUTs a file straight to a Drive resumable-upload
// session URL (obtained from one of our .../upload-session routes), so the
// bytes go browser -> Google directly instead of through our own serverless
// function. Uses XMLHttpRequest instead of fetch so upload progress is
// observable; fetch has no upload-progress event.
export function uploadFileDirect(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (!data?.id) {
            reject(new Error("Upload succeeded but no file ID was returned"));
            return;
          }
          resolve({ id: data.id });
        } catch {
          reject(new Error("Upload succeeded but the response couldn't be read"));
        }
      } else {
        reject(new Error(`Upload failed (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again"));
    xhr.send(file);
  });
}
