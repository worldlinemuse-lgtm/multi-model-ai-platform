/* Q09 read-only browser voice selection and bounded speech settings. */
export function validateSpeechSettings({rate=1,pitch=1,voiceURI=''}={}){
  const inRange=(v,k)=>{if(typeof v==='string'&&v.trim())v=Number(v);if(!Number.isFinite(v)||v<0.5||v>2)throw Error('Invalid speech '+k);return v;};
  if(typeof voiceURI!=='string'||voiceURI.length>200)throw Error('Invalid voice URI');
  return {rate:inRange(rate,'rate'),pitch:inRange(pitch,'pitch'),voiceURI};
}
export function chooseVoice(voices,uri){return Array.isArray(voices)?voices.find(x=>x?.voiceURI===uri)||null:null;}
