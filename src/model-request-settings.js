/* Q20 request output-token cap. Applies per explicitly sent route.
 * A token ceiling does not establish eligibility for a free provider allowance.
 */
export const ALLOWED_OUTPUT_CAPS=Object.freeze([128,256,512,1024]);
export function validateOutputCap(value){
 if(!Number.isSafeInteger(value)||!ALLOWED_OUTPUT_CAPS.includes(value))throw Error('Select an allowed output-token cap (128, 256, 512 or 1024).');
 return value;
}
