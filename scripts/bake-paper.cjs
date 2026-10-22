// Regenerate the paper texture fallback (design.md §13.4).
//
// Devices without WebGL (or with prefers-reduced-data) use the pre-rendered
// file this writes. It bakes the same texture the runtime bake produces —
// same shader, same params — by loading a tiny page in Chrome and reading
// the canvas back.
//
//   node scripts/bake-paper.cjs        # writes public/assets/paper/paper.png
//
// Output must stay well under 2 MB (scripts/check-large-files.cjs rejects
// anything bigger). Keep it small: a PNG of the 512px tile is ~30–60 KB.

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const OUT = path.join(__dirname, "..", "public", "assets", "paper");

async function main() {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();

  // Load the repo's compiled module through a data-url import? Simpler and
  // more honest: bundle nothing, inline the shader + a minimal WebGL pass
  // copied from src/components/paper/bakePaper.ts. The two must stay in
  // sync — if the bake there changes, mirror it here.
  const shaderDist = path.join(
    __dirname,
    "..",
    "node_modules",
    "@paper-design",
    "shaders",
    "dist",
  );
  // The shader source embeds shared utilities via string interpolation, so
  // import the module itself and take the evaluated strings — the same
  // values the runtime bake compiles.
  const { pathToFileURL } = require("node:url");
  const fragMod = await import(
    pathToFileURL(path.join(shaderDist, "shaders", "paper-texture.js")).href
  );
  const vertMod = await import(
    pathToFileURL(path.join(shaderDist, "vertex-shader.js")).href
  );
  const fragSrc = fragMod.paperTextureFragmentShader;
  const vertSrc = vertMod.vertexShaderSource;
  if (!fragSrc || !vertSrc) {
    throw new Error("could not extract shader sources from the package");
  }

  const dataUrl = await page.evaluate(
    async ({ fragSrc, vertSrc }) => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const gl = canvas.getContext("webgl2", {
        preserveDrawingBuffer: false,
        alpha: false,
        antialias: false,
      });
      if (!gl) return null;
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn(gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const vs = compile(gl.VERTEX_SHADER, vertSrc);
      const fs2 = compile(gl.FRAGMENT_SHADER, fragSrc);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs2);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        return null;
      }
      gl.useProgram(program);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 0, 1, 3, -1, 0, 1, -1, 3, 0, 1]),
        gl.STATIC_DRAW,
      );
      const pos = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, size, size);
      const loc = (n) => gl.getUniformLocation(program, n);
      const u1f = (n, v) => gl.uniform1f(loc(n), v);
      const u2f = (n, a, b) => gl.uniform2f(loc(n), a, b);
      const u4f = (n, a, b, c, d) => gl.uniform4f(loc(n), a, b, c, d);
      const u1i = (n, v) => gl.uniform1i(loc(n), v);
      u1i("u_isImage", 0);
      u1i("u_clip", 0);
      u1f("u_imageAspectRatio", 1);
      u1f("u_blending", 0);
      u1f("u_distortion", 0);
      u4f("u_colorBack", 1, 1, 1, 1);
      u4f("u_colorPaper", 0.965, 0.96, 0.955, 1);
      u4f("u_colorShadow", 0.88, 0.875, 0.865, 1);
      u1f("u_angle", 210);
      u1f("u_seed", 7);
      u1f("u_roughness", 0.55);
      u1f("u_roughnessSize", 0.35);
      u1f("u_roughnessRows", 0.2);
      u1f("u_fiber", 0.65);
      u1f("u_fiberSize", 0.4);
      u1f("u_folds", 0.22);
      u1f("u_foldSizeX", 0.6);
      u1f("u_foldSizeY", 0.45);
      u1f("u_foldOffsetX", 0.1);
      u1f("u_foldOffsetY", 0.35);
      u1f("u_wrinkles", 0);
      u1f("u_crumpleCount", 0);
      u1f("u_crumples", 0);
      u1f("u_drops", 0);
      u2f("u_resolution", size, size);
      u1f("u_pixelRatio", 1);
      u1f("u_originX", 0.5);
      u1f("u_originY", 0.5);
      u1f("u_fit", 0);
      u1f("u_scale", 1);
      u1f("u_rotation", 0);
      u1f("u_offsetX", 0);
      u1f("u_offsetY", 0);
      u1f("u_worldWidth", 0);
      u1f("u_worldHeight", 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return canvas.toDataURL("image/png");
    },
    { fragSrc, vertSrc },
  );

  await browser.close();
  if (!dataUrl) {
    console.error("bake failed: no WebGL2 in the browser");
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, "paper.png");
  fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  const bytes = fs.statSync(file).size;
  console.log(`wrote ${file} (${bytes} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
