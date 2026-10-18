# Presentation assets

3D models and graphics for the hackathon demo, pitch deck, and booth.

| Subfolder | Contents |
|-----------|----------|
| [`models/`](models/) | `.glb`, `.gltf`, `.obj`, Blender sources, etc. |
| [`graphics/`](graphics/) | Logos, screenshots, diagrams, slide exports (PNG, SVG, PDF) |

## Tips

- Keep filenames descriptive: `city-overview.glb`, `hero-slide.png`.
- For files over ~10 MB, consider [Git LFS](https://git-lfs.com) or a shared drive link in this README.
- The React app can load public assets from here if you copy or symlink into `application/public/` — document any copy step in `docs/setup/`.
