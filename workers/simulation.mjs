const policy = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://shieldio.cz https://learn.shieldio.cz";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return Response.json({status:'ok',app:'shieldio-simulation',version:'0.3.0-beta'});
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const result = await env.ASSETS.fetch(request);
    const response = new Response(result.body, result);
    response.headers.set('Content-Security-Policy', policy);
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    if (!url.pathname.includes('/vendor/')) response.headers.set('Cache-Control','no-cache');
    return response;
  }
};
