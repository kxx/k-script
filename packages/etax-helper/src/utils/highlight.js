// Render text nodes, never HTML, even if a response contains markup.
export function highlightJson(text) {
  try { JSON.parse(text); } catch { return [{type: '', text: text || '（空内容）'}]; }
  const tokens=[], pattern=/"(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let start=0;
  for(const match of text.matchAll(pattern)) {
    if(match.index>start) tokens.push({type:'',text:text.slice(start,match.index)});
    const value=match[0];
    tokens.push({type:value.endsWith(':')?'json-key':value.startsWith('"')?'json-string':/true|false|null/.test(value)?'json-literal':'json-number',text:value});
    start=match.index+value.length;
  }
  if(start<text.length)tokens.push({type:'',text:text.slice(start)});
  return tokens;
}
