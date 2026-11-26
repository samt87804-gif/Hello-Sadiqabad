export interface CompressedImageResult { file: File; originalBytes: number; compressedBytes: number; width: number; height: number; }
export interface CompressImageOptions { maxDimension?: number; quality?: number; maxInputBytes?: number; maxOutputBytes?: number; }
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp','image/avif']);
/** Re-encodes accepted images to WebP and refuses to upload the raw original if compression fails. */
export async function compressImageFile(source: File, options: CompressImageOptions = {}): Promise<CompressedImageResult> {
  const maxDimension=options.maxDimension??1600, quality=options.quality??0.84;
  const maxInputBytes=options.maxInputBytes??15*1024*1024, maxOutputBytes=options.maxOutputBytes??8*1024*1024;
  if(!SUPPORTED_IMAGE_TYPES.has(source.type))throw new Error('JPG, PNG, WebP ya AVIF image select karein.');
  if(source.size<=0||source.size>maxInputBytes)throw new Error('Selected image allowed size limit se bari hai.');
  if(typeof createImageBitmap==='undefined')throw new Error('Is browser mein image compression supported nahi. Updated Chrome/Edge use karein.');
  const bitmap=await createImageBitmap(source);
  try{
    for(const dimensionScale of [1,0.82,0.68]){
      const dimensionLimit=Math.max(320,Math.round(maxDimension*dimensionScale));
      const scale=Math.min(1,dimensionLimit/Math.max(bitmap.width,bitmap.height));
      const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const context=canvas.getContext('2d');if(!context)throw new Error('Image compression start nahi ho saki.');
      context.drawImage(bitmap,0,0,width,height);
      for(const outputQuality of [quality,Math.max(0.42,quality-0.12),Math.max(0.38,quality-0.24),0.42]){
        const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('Compressed WebP image generate nahi ho saki.')),'image/webp',outputQuality));
        if(blob.type!=='image/webp'||blob.size>=source.size||blob.size>maxOutputBytes)continue;
        const baseName=source.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9-_]+/gi,'-').slice(0,48)||'image';
        return {file:new File([blob],baseName+'-compressed.webp',{type:'image/webp',lastModified:Date.now()}),originalBytes:source.size,compressedBytes:blob.size,width,height};
      }
    }
    throw new Error('Image ka size kam nahi ho saka. Thori high-resolution ya smaller original image select karein.');
  }finally{bitmap.close();}
}
