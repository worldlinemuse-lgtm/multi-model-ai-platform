/* Q08 bounded browser-local image geometry. No network, storage or decoded binary in project text. */
export const IMAGE_MAX_PIXELS=32_000_000;
export const IMAGE_MAX_EDGE=8192;
export function imageGeometry(width,height,{cropPercent=0,rotation=0,original=false,previewMax=1600}={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>IMAGE_MAX_EDGE||height>IMAGE_MAX_EDGE||width*height>IMAGE_MAX_PIXELS)throw Error('Image dimensions exceed safe bounds');
 if(!Number.isInteger(cropPercent)||cropPercent<0||cropPercent>40)throw Error('Invalid center crop percentage');
 if(![0,90,180,270].includes(rotation))throw Error('Invalid right-angle rotation');
 const sx=Math.floor(width*cropPercent/100),sy=Math.floor(height*cropPercent/100);
 const sw=width-2*sx,sh=height-2*sy;
 if(sw<1||sh<1)throw Error('Crop is empty');
 const rotated=rotation%180!==0,naturalWidth=rotated?sh:sw,naturalHeight=rotated?sw:sh;
 const scale=original?1:Math.min(1,previewMax/naturalWidth,previewMax/naturalHeight);
 const outWidth=Math.max(1,Math.round(naturalWidth*scale)),outHeight=Math.max(1,Math.round(naturalHeight*scale));
 if(outWidth*outHeight>IMAGE_MAX_PIXELS)throw Error('Rendered image exceeds safe pixel limit');
 return {sx,sy,sw,sh,width:outWidth,height:outHeight,rotation,scale,naturalWidth,naturalHeight};
}
export function paintEditedImage(ctx,image,options,filter='none'){
 if(!ctx)throw Error('Canvas 2D context unavailable');
 const spec=imageGeometry(image.naturalWidth||image.width,image.naturalHeight||image.height,options);
 const canvas=ctx.canvas;canvas.width=spec.width;canvas.height=spec.height;
 ctx.save();
 try{
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.translate(spec.width/2,spec.height/2);
  ctx.rotate(spec.rotation*Math.PI/180);
  ctx.filter=filter;
  const w=spec.sw*spec.scale,h=spec.sh*spec.scale;
  ctx.drawImage(image,spec.sx,spec.sy,spec.sw,spec.sh,-w/2,-h/2,w,h);
 }finally{ctx.restore();}
 return spec;
}
