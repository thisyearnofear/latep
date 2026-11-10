// Merge per-pose animation GLBs into one rigged character GLB.
// Meshy emits one skinned GLB per pose clip (mesh duplicated); this copies
// just the animation channels into the rigged base, remapping nodes by name
// (bone names are identical across the files).
//
// Usage: node merge-clips.mjs <base.glb> <out.glb> <poseName=clip.glb> [...]

import { NodeIO } from "@gltf-transform/core";

const [base, out, ...pairs] = process.argv.slice(2);
const io = new NodeIO();

const dest = await io.read(base);
const destRoot = dest.getRoot();
const nodeByName = new Map();
for (const node of destRoot.listNodes()) {
  if (node.getName()) nodeByName.set(node.getName(), node);
}

for (const pair of pairs) {
  const eq = pair.indexOf("=");
  const clipName = pair.slice(0, eq);
  const clipFile = pair.slice(eq + 1);
  const src = await io.read(clipFile);
  const srcAnim = src.getRoot().listAnimations()[0];
  if (!srcAnim) {
    console.error(`no animation in ${clipFile}`);
    process.exit(1);
  }

  const anim = dest.createAnimation(clipName);
  for (const channel of srcAnim.listChannels()) {
    const nodeName = channel.getTargetNode()?.getName();
    const path = channel.getTargetPath();
    const destNode = nodeByName.get(nodeName);
    if (!destNode) {
      console.error(`missing node ${nodeName} in ${base}`);
      process.exit(1);
    }
    const sampler = channel.getSampler();
    const input = sampler.getInput();
    const output = sampler.getOutput();

    const destInput = dest
      .createAccessor()
      .setType(input.getType())
      .setArray(input.getArray())
      .setBuffer(dest.getRoot().listBuffers()[0]);
    const destOutput = dest
      .createAccessor()
      .setType(output.getType())
      .setArray(output.getArray())
      .setBuffer(dest.getRoot().listBuffers()[0]);

    const destSampler = dest
      .createAnimationSampler()
      .setInterpolation(sampler.getInterpolation())
      .setInput(destInput)
      .setOutput(destOutput);
    anim.addSampler(destSampler);
    const outChannel = dest
      .createAnimationChannel()
      .setTargetNode(destNode)
      .setTargetPath(path)
      .setSampler(destSampler);
    anim.addChannel(outChannel);
  }
  console.log(`merged ${clipName} <- ${clipFile}`);
}

// Rename Meshy's bind clip so it doesn't collide semantically.
for (const a of destRoot.listAnimations()) {
  if (a.getName() === "Armature|clip0|baselayer") a.setName("bind");
}

await io.write(out, dest);
console.log("wrote", out);
