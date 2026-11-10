# Meshy asset lab

Offline 3D asset experiments for the reveal room's set dressing. Generated
once via the Meshy API (`MESHY_API_KEY` in `.env`), optimized, and vendored to
`public/assets/reveal/`. Heavy intermediates are gitignored — regenerate from
the task IDs below rather than committing them (AGENTS.md).

## Pipeline

1. `meshy_text_to_image` (nano-banana-2-lite) → design image in the
   ink-on-paper editorial style.
2. `meshy_image_to_3d` (`meshy-t2` smart topology, `target_polycount` 6000,
   `texture_model` `meshy-n1`) → textured GLB.
3. `npx @gltf-transform/cli@4 optimize in.glb out.glb --compress false
--texture-compress webp --texture-size 1024` → ~300–360 KB GLB.

## Tasks (2026-11-09)

| Prop        | Image task                           | 3D task                              |
| ----------- | ------------------------------------ | ------------------------------------ |
| stamp       | 01a1c1b2-514a-7460-8e6b-3cd68146c936 | 01a1c1b8-f477-75de-9f53-c81da50402a2 |
| wax-seal    | 01a1c1b2-5245-77d9-afb9-f77cb453983c | 01a1c1b8-f86d-7394-a832-b93e2e0e610c |
| twine-spool | 01a1c1b2-5316-704d-9272-8eab4e555060 | 01a1c1b8-fc38-76df-80c4-fe88014f57a4 |

## Character experiments

| Asset            | Task ID                              | Notes                                 |
| ---------------- | ------------------------------------ | ------------------------------------- |
| ink-figure image | 01a1c1db-87ee-716e-a7d5-498970377a32 | t-pose, ink-illustration style        |
| ink-figure mesh  | 01a1c1db-daaf-756a-9685-dc507d5cb193 | t2.5 @12k + n1 texture                |
| ink-figure rig   | 01a1c1e3-b8d3-771b-8b5c-c689f59de4b4 | Mixamo-style bones (Hips/Spine/Hands) |

Rigging included walk + run clips free (armature GLBs in this dir). The room's
pose language (held / holding-back / toppled / standing) needs custom
`meshy_text_to_motion` + `meshy_animate` clips — not yet generated.

### Personality pass (2026-11-10)

Distinct silhouettes per design.md §13.5: faceless heads, differentiation via
clothing + skin tone + blue/amber accents. You = South American woman courier
(flat cap, satchel); partner = fit African man shopkeeper (apron, neckerchief).

| Character                  | Image task                           | 3D task                              | Rig task                             |
| -------------------------- | ------------------------------------ | ------------------------------------ | ------------------------------------ |
| courier-sa-f               | 01a1c4a8-c133-70ed-8977-d973f5e0ace4 | 01a1c554-8c98-71ca-96f9-3ee51b2b5cf8 | 01a1c555-e52a-703a-bb3d-758685783602 |
| courier-sa-f v2 (faceless) | 01a1c55b-d6f4-7356-8599-b50f6eccee99 | 01a1c582-0182-707d-bc83-cf9c28fd836f | 01a1c582-dd27-7262-b15d-a10602986cd3 |
| shopkeeper-af-m            | 01a1c4a8-c475-71ac-94bf-4e2660c36ad1 | 01a1c554-948c-71af-b264-eb007da09aee | 01a1c555-f240-70fd-8b9c-4c058e1cdd19 |

Both: `meshy-t2.5` smart topology @12k + `meshy-n1` texture, t-pose.

Merged + vendored (2026-11-10): `merge-clips.mjs` folds the four pose clips
into each rigged GLB (node remap by bone name), then gltf-transform optimize
→ `public/assets/reveal/courier.glb` + `shopkeeper.glb` (~830 KB each,
1K WebP). `src/components/reveal-room/actor.ts` loads them; the procedural
`figure.ts` rig remains the fallback on fetch failure or timeout.

Pose clips (2026-11-10): 4 swift `meshy_text_to_motion` clips shared across
both rigs — held `01a1c5ac-89a2`, holding-back `01a1c5ac-8caa`, toppled
`01a1c5ac-8f32`, standing `01a1c5ac-91e0` — applied via `meshy_animate`
(3cr each). Per-character GLBs: `courier-{held,holdback,toppled,standing}.glb`,
`shopkeeper-{...}.glb`. The viewer plays each clip once and clamps on the end
pose, matching how the reveal holds an outcome.

Meshy keeps results for 3 days after task completion; the gitignored
`*.glb` / `images/` files here are the archive. `viewer.html` is a standalone
three.js orbit viewer — serve the directory (`python3 -m http.server`) and
open `viewer.html`.
