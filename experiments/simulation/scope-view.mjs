const copy=x=>JSON.parse(JSON.stringify(x));
const keys=['start','span','follow','xShift','yShift','xScale','yScale'];
export function captureScopeView(state,config){return {state:Object.fromEntries(keys.filter(k=>state[k]!==undefined).map(k=>[k,state[k]])),channels:copy(config.channels||{})};}
export function rememberScopeView(state,config){const view=captureScopeView(state,config);state.viewHistory||=[];if(JSON.stringify(state.viewHistory.at(-1))!==JSON.stringify(view))state.viewHistory.push(view);state.viewHistory=state.viewHistory.slice(-32);}
export function restoreScopeView(state,config){const previous=state.viewHistory?.pop();if(!previous)return false;Object.assign(state,previous.state,{follow:false});config.channels=copy(previous.channels);return true;}
export function centerScopeView(state,config,{first=0,latest=0,cursor=latest}={}){for(const channel of Object.values(config.channels||{}))if(channel&&typeof channel==='object')channel.zero=0;state.xShift=state.yShift=0;state.xScale=state.yScale=1;const span=state.span||Math.max(0,latest-first);state.start=Math.max(first,Math.min(Math.max(first,latest-span),cursor-span/2));state.follow=false;}
