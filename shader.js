
// Vertex shader program
export const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    varying lowp vec2 vPos;
    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = aVertexPosition;
      vPos = aVertexPosition.xy;
      vColor = aVertexColor;
    }
  `;

export const fsSource = `
    varying lowp vec2 vPos;
    varying lowp vec4 vColor;

    uniform lowp float t;

    void main() {
      lowp float x = (vPos.x + 1.) * 10.;
      lowp float y = (vPos.y + 1.) * 10.;
      lowp float dr = cos((x * x - y * y)/300.) * 0.2;
      lowp float dg = sin((x*x*cos(t/4.)+y*y*sin(t/3.))/300.) * 0.2;
      lowp float db = sin((5.*sin(t/9.) + ((x-100.)*(x-100.)+(y-100.)*(y-100.)))/1100.) * 0.2;
      gl_FragColor = vec4(vColor.r + dr, vColor.g + dg, vColor.b + db, vColor.a);
    }
  `;

export function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}

export function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

