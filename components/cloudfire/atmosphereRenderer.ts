// One textured quad: the existing photograph supplies the detail, noise supplies slow
// billowing and heat shimmer. No video download, geometry, or per-frame React updates.
const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
uniform sampler2D u_image;
uniform float u_time;
varying vec2 v_uv;
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x), u.y);
}
float turbulence(vec2 p) {
  float value = 0.0;
  float weight = 0.5;
  mat2 turn = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 3; i++) {
    value += weight * noise(p);
    p = turn * p * 2.03 + 7.1;
    weight *= 0.5;
  }
  return value;
}
void main() {
  vec2 uv = v_uv;
  vec3 reference = texture2D(u_image, uv).rgb;
  float material = smoothstep(0.025, 0.19, dot(reference, vec3(0.299, 0.587, 0.114)));
  float fire = smoothstep(0.06, 0.32, reference.r - max(reference.g, reference.b));
  float edge = smoothstep(0.015, 0.14, uv.x) * (1.0 - smoothstep(0.86, 0.985, uv.x))
             * smoothstep(0.015, 0.14, uv.y) * (1.0 - smoothstep(0.86, 0.985, uv.y));
  // Large, rising eddies carry the cloud. Smaller detail follows the same wind,
  // so the material billows as a whole instead of wobbling in separate patches.
  vec2 wind = vec2(-u_time * 0.035, u_time * 0.055);
  vec2 broad = vec2(
    turbulence(uv * 3.0 + wind),
    turbulence(uv * 3.0 + wind + vec2(17.2, 9.1))
  ) - 0.4375;
  vec2 detail = vec2(
    noise(uv * 9.0 + wind * 1.6),
    noise(uv * 9.0 + wind * 1.6 + vec2(6.4, 3.8))
  ) - 0.5;
  vec2 swell = vec2(
    sin(uv.y * 5.0 - u_time * 0.18),
    cos(uv.x * 4.0 + uv.y * 2.0 - u_time * 0.14)
  );
  vec2 drift = broad * 0.085 + detail * 0.009 + swell * vec2(0.018, 0.014);
  float heat = noise(uv * vec2(10.0, 15.0) + vec2(-u_time * 0.08, u_time * 0.35)) - 0.5;
  drift += vec2(heat * 0.008, sin(uv.y * 8.0 - u_time * 0.6) * 0.012) * fire;
  vec3 color = texture2D(u_image, clamp(uv + drift * edge * material, 0.001, 0.999)).rgb;
  float breath = 1.0 + 0.035 * sin(u_time * 0.25 + uv.y * 2.0);
  float firelight = 1.0 + 0.10 * sin(u_time * 0.48) + 0.025 * sin(u_time * 1.3 + uv.y * 5.0);
  color *= mix(breath, firelight, fire);
  color += vec3(0.045, 0.012, 0.001) * fire * (0.5 + 0.5 * sin(u_time * 0.48));
  gl_FragColor = vec4(color, 1.0);
}`;

export type AtmosphereRenderer = {
  draw: (time: number) => void;
  resize: () => void;
  dispose: () => void;
};

export function createAtmosphereRenderer(canvas: HTMLCanvasElement, onReady: () => void, onFailure: () => void, source = "/brand/cloudfire-hero.webp"): AtmosphereRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let disposed = false;
  let image: HTMLImageElement | null = null;
  const dispose = () => {
    disposed = true;
    if (image) { image.onload = null; image.onerror = null; }
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader unavailable");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader compilation failed");
      return shader;
    };
    program = gl.createProgram();
    if (!program) throw new Error("Program unavailable");
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, precision ? fragmentSource : fragmentSource.replace("highp", "mediump")));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link failed");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    texture = gl.createTexture();
    if (!buffer || !texture) throw new Error("Resources unavailable");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const resize = () => {
      const mobile = window.matchMedia("(max-width: 599px)").matches;
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25);
      // Keep the photograph's aspect ratio. The cap keeps one frame affordable on phones.
      const width = Math.max(2, Math.round(Math.min(box.width * ratio, mobile ? 720 : 1200) / 3) * 3);
      const height = width * 2 / 3;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (time: number) => {
      if (disposed || gl.isContextLost()) return;
      gl.uniform1f(timeUniform, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    image = new window.Image();
    image.onload = () => {
      if (disposed || !image || gl.isContextLost()) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        resize();
        draw(0);
        onReady();
      } catch { onFailure(); }
    };
    image.onerror = onFailure;
    image.src = source;
    return { draw, resize, dispose };
  } catch {
    dispose();
    return null;
  }
}
