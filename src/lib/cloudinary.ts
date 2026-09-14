import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Clearance forms (PDF/JPG/PNG) are stored under Cloudinary's 'image' resource
// type — Cloudinary rasterizes PDFs for delivery the same way it does images —
// which keeps a single resource_type across all three accepted formats.
const RESOURCE_TYPE = 'image';
const FOLDER = 'clearance-forms';

// Uploads a clearance form as a private ("authenticated") Cloudinary resource,
// server-side only. The upload API secret never reaches the browser.
// Returns "<public_id>.<format>" — stored verbatim in
// document_requests.clearance_form_public_id (not a URL; resolved at view
// time via getClearanceFormDownloadUrl).
export function uploadClearanceForm(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: RESOURCE_TYPE, type: 'authenticated', folder: FOLDER },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(`${result.public_id}.${result.format}`);
      },
    );
    stream.end(buffer);
  });
}

// Generates a short-lived signed URL for a private clearance form so the
// server can fetch its bytes. This URL is never sent to the browser.
export function getClearanceFormDownloadUrl(publicIdWithFormat: string): string {
  const lastDot = publicIdWithFormat.lastIndexOf('.');
  const publicId = publicIdWithFormat.slice(0, lastDot);
  const format = publicIdWithFormat.slice(lastDot + 1);

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: RESOURCE_TYPE,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });
}
