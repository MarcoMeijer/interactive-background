import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { initShaderProgram, vsSource, fsSource } from "./shader.js";

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");

const cw = window.innerWidth;
const ch = window.innerHeight;
const mouse = { x: 0, y: 0 };
canvas.width = cw;
canvas.height = ch;

let vertices = [];
let colors = [];
let indices = [];

function vertex(position, color) {
  vertices.push((position.x / cw * 2) - 1, ((ch - position.y) / ch) * 2 - 1);
  colors.push(color.r, color.g, color.b, color.a ?? 1);
  return vertices.length / 2 - 1;
}

function triangle(v1, v2, v3) {
  indices.push(v1, v2, v3);
}

function quad(v1, v2, v3, v4) {
  indices.push(v1, v2, v3, v3, v4, v1);
}

function triangulate(...vertices) {
  for (let i = 1; i < vertices.length - 1; i++) {
    triangle(vertices[0], vertices[i], vertices[i + 1]);
  }
}

function shape(cx, cy, sides, r) {
  const points = [];
  const angle = Math.PI * 2 / sides;
  for (let i = 0; i < sides; i++) {
    const x = cx + Math.sin(angle * i) * r;
    const y = cy + Math.cos(angle * i) * r;
    points.push({ x, y })
  }
  const speed = { x: 0, y: 0 };
  return {
    points,
    speed,
  }
}

function shadowPoint({ x, y }) {
  const dx = x - mouse.x;
  const dy = y - mouse.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const mul = 2000 / len;
  return { x: x + dx * mul, y: y + dy * mul };
}

function drawShadow(shape) {
  const { points } = shape;

  const shadowColor = { r: 0.3, g: 0.3, b: 0.3 };
  for (let i = 0; i < points.length; i++) {
    let j = (i + 1) % points.length;
    const pi = points[i];
    const pj = points[j];
    const si = shadowPoint(pi);
    const sj = shadowPoint(pj);
    quad(
      vertex(pi, shadowColor),
      vertex(si, shadowColor),
      vertex(sj, shadowColor),
      vertex(pj, shadowColor),
    );
  }
}
function drawShape(shape) {
  const { points } = shape;
  const color = { r: 0.5, g: 0.5, b: 0.5 };
  triangulate(...points.map((point) => vertex(point, color)));
}

function centerOf(shape) {
  const { points } = shape;
  const center = { x: 0, y: 0 };
  for (const { x, y } of points) {
    center.x += x;
    center.y += y;
  }
  center.x /= points.length;
  center.y /= points.length;
  return center;
}

function changeSpeed(shape) {
  const { speed } = shape;


  speed.x += (Math.random() - 0.5) * 0.3;
  speed.y += (Math.random() - 0.5) * 0.3;
  speed.x = Math.min(2, Math.abs(speed.x)) * Math.sign(speed.x);
  speed.y = Math.min(2, Math.abs(speed.y)) * Math.sign(speed.y);

  const center = centerOf(shape);
  const dmx = mouse.x - center.x;
  const dmy = mouse.y - center.y;
  const r = Math.sqrt(dmx * dmx + dmy * dmy);
  speed.x -= 100000 * dmx / (r * r * r * r);
  speed.y -= 100000 * dmy / (r * r * r * r);
}

function moveShape(shape) {
  const { speed, points } = shape;
  for (const point of points) {
    point.x += speed.x;
    point.y += speed.y;
  }
  for (const point of points) {
    if (point.x < 0) {
      speed.x = Math.abs(speed.x) * 0.7;
    }
    if (point.x > canvas.width) {
      speed.x = -Math.abs(speed.x) * 0.7;
    }
    if (point.y < 0) {
      speed.y = Math.abs(speed.y) * 0.7;
    }
    if (point.y > canvas.height) {
      speed.y = -Math.abs(speed.y) * 0.7;
    }
  }
}

const shapes = [];
for (let j = 0; j < 7; j++) {
  for (let i = 3; i < 7; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    shapes.push(shape(x, y, i, 40));
  }
}
shapes.push(shape(1e9, 1e9, 3, 40));

const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
  program: shaderProgram,
  attribLocations: {
    vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
  },
  uniformLocations: {
    t: gl.getUniformLocation(shaderProgram, "t"),
  },
};

let t = 0;
function render() {
  t += 0.05;

  vertices = [];
  colors = [];
  indices = [];

  const backShade = 0.93;
  const backgroundColor = { r: backShade, g: backShade, b: backShade };
  quad(
    vertex({ x: 0, y: 0 }, backgroundColor),
    vertex({ x: cw, y: 0 }, backgroundColor),
    vertex({ x: cw, y: ch }, backgroundColor),
    vertex({ x: 0, y: ch }, backgroundColor),
  );
  for (const shape of shapes) {
    drawShadow(shape);
  }
  for (const shape of shapes) {
    drawShape(shape);
  }

  for (const shape of shapes) {
    changeSpeed(shape);
  }
  for (const shape of shapes) {
    moveShape(shape);
  }
  const buffers = initBuffers(gl, vertices, colors, indices);

  // Draw the scene
  drawScene(gl, programInfo, buffers, indices.length, t);

  window.requestAnimationFrame(render);
}

render();


window.addEventListener('mousemove', function(e) {
  mouse.x = e.x;
  mouse.y = e.y;
});
