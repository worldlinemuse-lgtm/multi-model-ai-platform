/* Q16 bounded arithmetic expression REPL; intentionally NOT JavaScript or an OS shell. No eval. */
export function createExpressionSession(){
 const vars=new Map();
 function evaluate(text){
  if(typeof text!=='string'||text.length>200||!text.trim())throw Error('Expression requires 1–200 characters');
  if(text.trim()==='clear'){vars.clear();return 'Session cleared';}
  const match=text.trim().match(/^(?:let\s+)?([A-Za-z_]\w{0,30})\s*=\s*(.+)$/s);
  const source=match?match[2]:text;
  const tokens=[];const pattern=/\s*(\d+(?:\.\d+)?|[A-Za-z_]\w*|[()+*/-])\s*/gy;
  let index=0;
  while(index<source.length){
   pattern.lastIndex=index;const m=pattern.exec(source);
   if(!m)throw Error('Unsupported expression character');
   tokens.push(m[1]);index=pattern.lastIndex;
   if(tokens.length>120)throw Error('Expression token limit');
  }
  let at=0,steps=0;
  const limit=()=>{if(++steps>200)throw Error('Expression operation limit')};
  const finite=n=>{if(!Number.isFinite(n))throw Error('Result is not a finite number');return n};
  function atom(){
   limit();const t=tokens[at++];
   if(t===undefined)throw Error('Incomplete expression');
   if(t==='-')return finite(-atom());
   if(t==='+')return atom();
   if(t==='('){const n=sum();if(tokens[at++]!==')')throw Error('Missing closing parenthesis');return n;}
   if(/^\d/.test(t))return finite(Number(t));
   if(/^[A-Za-z_]\w*$/.test(t)){if(!vars.has(t))throw Error('Unknown variable: '+t);return vars.get(t)}
   throw Error('Unexpected token');
  }
  function product(){
   let n=atom();while(['*','/'].includes(tokens[at])){
    const op=tokens[at++],value=atom();n=finite(op==='*'?n*value:n/value);limit();
   }return n;
  }
  function sum(){
   let n=product();while(['+','-'].includes(tokens[at])){
    const op=tokens[at++],value=product();n=finite(op==='+'?n+value:n-value);limit();
   }return n;
  }
  const result=sum();
  if(at!==tokens.length)throw Error('Unexpected trailing input');
  if(match){
   const name=match[1];
   if(vars.size>=32&&!vars.has(name))throw Error('Maximum 32 local variables');
   vars.set(name,result);
  }
  return result;
 }
 return {execute:evaluate,reset:()=>vars.clear()};
}
