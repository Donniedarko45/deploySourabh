/** The artwork is rendered at glyph resolution, then composed through a glyph atlas.
 * Ray marching therefore runs once per character, not once per screen pixel. */
export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() { v_uv = a_position * .5 + .5; gl_Position = vec4(a_position, 0., 1.); }
`;

export const fieldShader = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scene;
uniform float u_energy;
uniform vec3 u_pointer;
uniform vec3 u_wake;
uniform vec4 u_ripples[4];

mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x) {
  vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { return .57*noise(p) + .28*noise(p*2.03+4.1) + .15*noise(p*4.01+8.3); }
float scene(vec3 p) {
  float t=u_time*.12;
  float order=exp(-pow(u_scene-2.,2.)*2.);
  float flame=smoothstep(4.2,5.,u_scene);
  float architecture=exp(-pow(u_scene-1.,2.)*2.);
  float layers=exp(-pow(u_scene-3.,2.)*2.);
  float flow=exp(-pow(u_scene-4.,2.)*3.);
  p.y += .12*sin(t*.7);
  p.xz=rot(p.y*(.48 + flame*.65)+.35*sin(t*.3)+u_energy*.12)*p.xz;
  p.xy=rot(-.40 + architecture*.35 - flame*.25)*p.xy;
  p.x -= flame*.19*sin(p.y*2.2+t*.5);
  p.x /= mix(1.15,.64*clamp(1.05-p.y*.28,.52,1.5),flame);
  p.y /= mix(.96,1.3,flame);
  float envelope=length(p/vec3(1.5,1.35,1.05))-1.;
  vec3 q=p;
  q += (fbm(p*1.7+vec3(t*.4,t*.2,-t*.3))-.5)*mix(.55,.15,order);
  q.y += flow*.35*sin(q.x*1.8-t*.7);
  q.z *= 1.+layers*.65;
  float folds=sin(q.x*3.3 + t*.26)*cos(q.y*2.6) + sin(q.y*3.3)*cos(q.z*2.6+t*.3) + sin(q.z*3.3)*cos(q.x*2.6);
  float cloth=(abs(folds)-mix(.20,.105,architecture))/7.;
  float ordered=abs(q.z-.24*sin(q.x*3.1+t)-.24*cos(q.y*3.5))-.06;
  return max(mix(cloth,ordered,order*.72),envelope*.7);
}
void main() {
  float aspect=u_resolution.x/u_resolution.y;
  float mobile=1.-step(1.,aspect);
  float hero=1.-smoothstep(0.,.8,u_scene);
  float flame=smoothstep(4.2,5.,u_scene);
  vec2 center=mix(vec2(.67,.53),vec2(.70,.50),flame);
  center=mix(vec2(.55,.47),center,hero+flame*(1.-hero));
  center=mix(center,mix(vec2(.60,.25),vec2(.65,.34),flame),mobile);
  vec2 screen=(v_uv-center)*vec2(aspect,1.);
  float influence=exp(-dot(v_uv-u_pointer.xy,v_uv-u_pointer.xy)*65.)*u_pointer.z;
  vec2 displacement=normalize(v_uv-u_pointer.xy+vec2(.0001))*influence*.055;
  vec2 wakeDelta=v_uv-u_wake.xy;
  displacement+=normalize(wakeDelta+vec2(.0001))*exp(-dot(wakeDelta,wakeDelta)*110.)*u_wake.z*.035;
  float rippleLight=0.;
  for(int i=0;i<4;i++) {
    float age=u_ripples[i].z;
    float d=length((v_uv-u_ripples[i].xy)*vec2(aspect,1.));
    float wave=exp(-pow((d-age*.24)*25.,2.))*exp(-age*1.5)*u_ripples[i].w;
    displacement+=normalize(v_uv-u_ripples[i].xy+vec2(.0001))*wave*.045;
    rippleLight+=wave*.25;
  }
  screen-=displacement*vec2(aspect,1.);
  float zoom=mix(3.45,3.8,mobile);
  vec3 ro=vec3(screen*zoom,3.5), rd=vec3(0,0,-1);
  float distance=0.; vec3 p; bool hit=false;
  for(int i=0;i<48;i++) { p=ro+rd*distance; float d=scene(p); if(d<.008) { hit=true; break; } distance+=max(d*.78,.018); if(distance>6.) break; }
  if(!hit) { gl_FragColor=vec4(0); return; }
  vec2 e=vec2(.012,0);
  vec3 n=normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
  vec3 light=normalize(vec3(-.55,.8,1.2));
  float diffuse=max(0.,dot(n,light));
  float rim=pow(1.-abs(n.z),2.)*.38;
  float depth=exp(-max(0.,distance-2.3)*.37);
  float texture=fbm(p*7.+vec3(0,u_time*.015,0));
  float intensity=(.19+diffuse*.90+rim)*depth*(.80+texture*.20);
  float ridge=pow(max(0.,dot(n,normalize(vec3(.8,.3,.5)))),3.);
  float traveling=exp(-pow((p.y*.65+p.x*.4-sin(u_time*.12)*1.15),2.)*11.);
  float orange=traveling*(.20+ridge*.8)*1.1 + flame*exp(-p.x*p.x*13.)*.80;
  intensity+=influence*.12+rippleLight+u_energy*.06;
  float leftMask=mix(1.,smoothstep(.26,.53,v_uv.x),hero*(1.-mobile));
  float edge=smoothstep(0.,.08,v_uv.y)*smoothstep(1.,.93,v_uv.y);
  float mobileReadability=mix(1.,(1.-smoothstep(.40,.72,v_uv.y))*.65,mobile);
  intensity*=leftMask*edge*mobileReadability*mix(1.,.55,smoothstep(.7,1.,u_scene)*(1.-flame));
  vec3 color=mix(vec3(.82,.83,.81),vec3(1.,.31,.15),clamp(orange,0.,.90));
  gl_FragColor=vec4(color*intensity,clamp(intensity,0.,1.));
}
`;

export const glyphShader = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_field;
uniform sampler2D u_atlas;
uniform vec2 u_grid;
uniform float u_reveal;
uniform float u_aspect;
uniform vec3 u_pointer;
uniform vec3 u_wake;
uniform vec4 u_ripples[4];
void main() {
  vec2 delta=v_uv-u_pointer.xy;
  vec2 force=normalize(delta+vec2(.0001))*exp(-dot(delta,delta)*75.)*u_pointer.z*.006;
  vec2 wakeDelta=v_uv-u_wake.xy;
  force+=normalize(wakeDelta+vec2(.0001))*exp(-dot(wakeDelta,wakeDelta)*120.)*u_wake.z*.004;
  for(int i=0;i<4;i++) {
    vec2 d=v_uv-u_ripples[i].xy;
    float age=u_ripples[i].z;
    float wave=exp(-pow((length(d*vec2(u_aspect,1.))-age*.24)*25.,2.))*exp(-age*1.5)*u_ripples[i].w;
    force+=normalize(d+vec2(.0001))*wave*.008;
  }
  vec2 lattice=(v_uv-force)*u_grid;
  vec2 cell=floor(lattice);
  vec4 field=texture2D(u_field,(cell+.5)/u_grid);
  float index=floor(clamp(field.a*1.55,0.,.999)*12.);
  vec2 local=fract(lattice);
  vec2 atlasUV=vec2((index+local.x)/12.,local.y);
  float glyph=texture2D(u_atlas,atlasUV).r;
  gl_FragColor=vec4(vec3(.0392)+field.rgb*glyph*u_reveal,1.);
}
`;

export class AsciiRenderer {
  private gl: WebGLRenderingContext;
  private field: WebGLProgram;
  private glyphs: WebGLProgram;
  private texture: WebGLTexture;
  private atlas: WebGLTexture;
  private framebuffer: WebGLFramebuffer;
  private columns = 1;
  private rows = 1;
  private resources: { shaders: WebGLShader[]; buffer: WebGLBuffer };

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
      shaders.push(shader); return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const program = (source: string) => {
      const result = gl.createProgram()!;
      gl.attachShader(result, vertex); gl.attachShader(result, compile(gl.FRAGMENT_SHADER, source)); gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result) || "Shader link failed");
      return result;
    };
    this.field = program(fieldShader); this.glyphs = program(glyphShader);
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    this.resources = { shaders, buffer };
    const texture = () => {
      const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t;
    };
    this.texture = texture(); this.atlas = texture(); this.framebuffer = gl.createFramebuffer()!;
    const atlas = document.createElement("canvas"); atlas.width = 24*12; atlas.height = 40;
    const ctx = atlas.getContext("2d")!;
    ctx.fillStyle = "black"; ctx.fillRect(0,0,atlas.width,atlas.height);
    ctx.font = '28px "Courier New", monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "white";
    Array.from(" .,:;-=+*#%@").forEach((char,i) => ctx.fillText(char,i*24+12,21));
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
  }

  resize(width: number, height: number, quality = 1) {
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(width*dpr); this.canvas.height = Math.round(height*dpr);
    const cell = (width < 700 ? 7.2 : 6.2)/quality;
    this.columns = Math.ceil(width/cell); this.rows = Math.ceil(height/(cell*1.65));
    gl.bindTexture(gl.TEXTURE_2D,this.texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.columns,this.rows,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.texture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error("ASCII framebuffer unavailable");
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }

  render(time: number, scene: number, pointer: number[], wake: number[], ripples: Float32Array, energy: number, reveal: number) {
    const gl = this.gl;
    const bind = (program: WebGLProgram) => {
      gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER,this.resources.buffer);
      const position = gl.getAttribLocation(program,"a_position");
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    };
    bind(this.field); gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuffer); gl.viewport(0,0,this.columns,this.rows);
    const uniform = (name: string) => gl.getUniformLocation(this.field,name);
    gl.uniform2f(uniform("u_resolution"),this.canvas.width,this.canvas.height);
    gl.uniform1f(uniform("u_time"),time); gl.uniform1f(uniform("u_scene"),scene); gl.uniform1f(uniform("u_energy"),energy);
    gl.uniform3fv(uniform("u_pointer"),pointer); gl.uniform3fv(uniform("u_wake"),wake); gl.uniform4fv(uniform("u_ripples[0]"),ripples);
    gl.drawArrays(gl.TRIANGLES,0,6);
    bind(this.glyphs); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.texture); gl.uniform1i(gl.getUniformLocation(this.glyphs,"u_field"),0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,this.atlas); gl.uniform1i(gl.getUniformLocation(this.glyphs,"u_atlas"),1);
    gl.uniform2f(gl.getUniformLocation(this.glyphs,"u_grid"),this.columns,this.rows);
    gl.uniform1f(gl.getUniformLocation(this.glyphs,"u_aspect"),this.canvas.width/this.canvas.height);
    gl.uniform3fv(gl.getUniformLocation(this.glyphs,"u_pointer"),pointer); gl.uniform3fv(gl.getUniformLocation(this.glyphs,"u_wake"),wake);
    gl.uniform4fv(gl.getUniformLocation(this.glyphs,"u_ripples[0]"),ripples);
    gl.uniform1f(gl.getUniformLocation(this.glyphs,"u_reveal"),reveal); gl.drawArrays(gl.TRIANGLES,0,6);
    gl.activeTexture(gl.TEXTURE0);
  }

  dispose() {
    const gl=this.gl;
    gl.deleteProgram(this.field); gl.deleteProgram(this.glyphs); gl.deleteTexture(this.texture); gl.deleteTexture(this.atlas);
    gl.deleteFramebuffer(this.framebuffer); gl.deleteBuffer(this.resources.buffer); this.resources.shaders.forEach(shader=>gl.deleteShader(shader));
  }
}
