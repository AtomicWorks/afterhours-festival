// Hero water surface. A procedural height field with expanding ripples, shaded as dark water with acid glints.
// The cursor drops ripples into it; the light glint follows the cursor. No dependencies.
(() => {
  'use strict';
  const canvas = document.querySelector('#water');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;

  const DROPS = 28;

  const vertex = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uTime;uniform float uEnergy;uniform vec2 uLight;
uniform vec4 uDrops[${DROPS}];
vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;
  i=mod(i,289.);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m;m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
float height(vec2 p){
  float t=uTime;
  float h=snoise(vec2(p.x*1.4+t*.045,p.y*1.4-t*.06))*.42;
  h+=snoise(p*3.6+vec2(-t*.11,t*.08))*.07;
  h*=1.+uEnergy*1.6;
  for(int i=0;i<${DROPS};i++){
    vec4 d=uDrops[i];
    float age=t-d.z;
    if(d.w<=0.||age<0.||age>4.5)continue;
    float dist=length(p-d.xy);
    float x=dist-age*.26;
    float env=exp(-x*x*260.)*exp(-age*1.15)*d.w/(1.+dist*4.);
    h+=sin(x*150.)*env*.13;
  }
  return h;
}
float web(vec2 q,float t){
  float a=1.-abs(snoise(q*3.2+vec2(t*.05,-t*.04)));
  float b=1.-abs(snoise(q*5.1-vec2(t*.07,t*.03)+3.7));
  return pow(a,26.)*.8+pow(b,30.)*.5;
}
void main(){
  vec2 p=gl_FragCoord.xy/uRes.y;
  float aspect=uRes.x/uRes.y;
  float e=1./uRes.y;
  float h0=height(p),hx=height(p+vec2(e,0.)),hy=height(p+vec2(0.,e));
  const float S=.022;
  vec3 n=normalize(vec3(-(hx-h0)/e*S,-(hy-h0)/e*S,1.));
  vec2 q=p+n.xy*.16;
  vec3 col=mix(vec3(.010,.013,.009),vec3(.035,.050,.018),smoothstep(1.1,-.1,length(q-vec2(aspect*.68,.58))));
  col+=vec3(.42,.66,.02)*web(q,uTime)*.075;
  vec3 L=normalize(vec3(uLight-p,.9));
  vec3 H=normalize(L+vec3(0.,0.,1.));
  float nh=max(dot(n,H),0.);
  float glow=exp(-length(uLight-p)*2.4);
  col+=vec3(.92,1.,.55)*pow(nh,220.)*(.3+glow*.9);
  col+=vec3(.55,.85,.06)*pow(nh,40.)*.035*(.4+glow);
  float slope=1.-n.z;
  col+=vec3(.50,.80,.04)*smoothstep(.02,.2,slope)*.05;
  vec2 rv=n.xy*2.;
  float band=dot(rv,normalize(vec2(-.55,.85)));
  float sky=smoothstep(.22,.3,band)*smoothstep(.62,.4,band);
  float rim=smoothstep(.24,.32,-band)*smoothstep(.7,.45,-band);
  col+=vec3(.86,1.,.5)*sky*.42;
  col+=vec3(.45,.72,.02)*rim*.22;
  col*=1.-smoothstep(.12,.4,-band)*.4;
  col+=vec3(.06,.09,.0)*glow*.25;
  float vig=smoothstep(1.35,.25,length((gl_FragCoord.xy/uRes-.5)*vec2(1.25,1.)));
  col*=.55+.45*vig;
  gl_FragColor=vec4(col,1.);
}`;

  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'Water shader unavailable');
    return s;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch { return; }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  const u = name => gl.getUniformLocation(program, name);
  const uRes = u('uRes'), uTime = u('uTime'), uEnergy = u('uEnergy'), uLight = u('uLight'), uDrops = u('uDrops');

  const drops = new Float32Array(DROPS * 4);
  let head = 0, clock = 0, lastTime = 0, frameId = 0, visible = true, dirty = true;
  let cssW = 1, cssH = 1, level = 0, avgLevel = 0, lastBeat = 0, nextRain = 1.5;
  const light = { x: 0, y: 0, tx: 0, ty: 0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const paused = () => window.afterhoursMotion?.paused ?? reduced.matches;
  const bins = new Uint8Array(128);

  // Drops are stored in "height units": x in [0, aspect], y in [0, 1], y up.
  function addDrop(x, y, strength) {
    const i = head * 4;
    drops[i] = x; drops[i + 1] = y; drops[i + 2] = clock; drops[i + 3] = strength;
    head = (head + 1) % DROPS;
    dirty = true;
    schedule();
  }
  const toField = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / r.height, y: 1 - (clientY - r.top) / r.height, inside: clientY >= r.top && clientY <= r.bottom && clientX >= r.left && clientX <= r.right };
  };
  const randomDrop = s => addDrop(Math.random() * (cssW / cssH), .1 + Math.random() * .8, s);

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
    let w = cssW * Math.min(devicePixelRatio || 1, 1.5), h = cssH * Math.min(devicePixelRatio || 1, 1.5);
    const k = Math.min(1, Math.sqrt(950000 / (w * h)));
    w = Math.round(w * k); h = Math.round(h * k);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    if (!light.x) { light.x = light.tx = (cssW / cssH) * .7; light.y = light.ty = .62; }
    dirty = true; schedule();
  }

  // Cursor: ripples along the path, glint follows. Listening on window keeps the text above inert.
  let lastDrop = { x: -9, y: -9, t: 0 };
  addEventListener('pointermove', e => {
    if (paused()) return;
    const f = toField(e.clientX, e.clientY);
    if (!f.inside) return;
    light.tx = f.x; light.ty = f.y;
    const now = performance.now();
    const dx = (f.x - lastDrop.x) * cssH, dy = (f.y - lastDrop.y) * cssH;
    const dist = Math.hypot(dx, dy), dt = Math.max(16, now - lastDrop.t);
    if (dist > 26 || (dist > 6 && dt > 90)) {
      const speed = dist / dt; // px per ms
      addDrop(f.x, f.y, Math.min(.85, .18 + speed * .32));
      lastDrop = { x: f.x, y: f.y, t: now };
    }
    schedule();
  }, { passive: true });
  addEventListener('pointerdown', e => {
    if (paused()) return;
    const f = toField(e.clientX, e.clientY);
    if (f.inside) addDrop(f.x, f.y, 1.5);
  }, { passive: true });

  function draw(timestamp) {
    frameId = 0;
    if (document.hidden || !visible) return;
    const still = paused();
    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, .05) : 0;
    lastTime = timestamp;
    if (!still) {
      clock += delta;
      nextRain -= delta;
      if (nextRain <= 0) { randomDrop(.25 + Math.random() * .3); nextRain = 1.6 + Math.random() * 2.2; }
      const analyser = window.afterhoursAudio?.analyser;
      if (analyser && window.afterhoursAudio.playing) {
        analyser.getByteFrequencyData(bins);
        const now = bins.slice(0, 30).reduce((a, b) => a + b, 0) / (30 * 255);
        level = level * .5 + now * .5;
        avgLevel = avgLevel * .97 + now * .03;
        if (now > avgLevel * 1.3 && now > .22 && clock - lastBeat > .28) { lastBeat = clock; randomDrop(.7 + now); }
      } else level *= .92;
      light.x += (light.tx - light.x) * .06;
      light.y += (light.ty - light.y) * .06;
    }
    if (!still || dirty) {
      dirty = false;
      gl.uniform1f(uTime, clock);
      gl.uniform1f(uEnergy, Math.min(1, level * 1.3));
      gl.uniform2f(uLight, light.x, light.y);
      gl.uniform4fv(uDrops, drops);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!still) schedule();
  }
  function schedule() { if (!frameId && visible && !document.hidden) frameId = requestAnimationFrame(draw); }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) { lastTime = 0; dirty = true; schedule(); } }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastTime = 0; schedule(); } });
  window.addEventListener('afterhours-motion', () => { dirty = true; lastTime = 0; schedule(); });
  window.addEventListener('afterhours-pulse', () => { if (!paused()) randomDrop(1.2); });
  window.addEventListener('afterhours-intro', () => {
    if (paused()) return;
    const a = cssW / cssH;
    addDrop(a * .7, .58, 1.8);
    setTimeout(() => addDrop(a * .74, .52, 1.1), 380);
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); document.documentElement.classList.remove('water-ready'); visible = false; });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  document.documentElement.classList.add('water-ready');
  resize();
})();
