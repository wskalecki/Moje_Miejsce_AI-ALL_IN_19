#!/usr/bin/env bash
# Create hackathon backlog issues. Requires: gh auth login (or valid GH_TOKEN).
set -euo pipefail

REPO="wskalecki/wwa42hackathon_ai_all_in"
cd "$(dirname "$0")/.."

if ! gh auth status &>/dev/null; then
  echo "Run: gh auth login"
  exit 1
fi

create_label() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || true
}

create_label epic 5319e7 "MVP epic"
create_label data 0e8a16 "Data / ETL"
create_label frontend 1d76db "React map app"
create_label design d4c5f9 "UI / visual system"
create_label 3d f9d0c4 "3D buildings / presentation"
create_label chore fbca04 "Tooling and docs"

issue() {
  local title="$1"
  local body="$2"
  shift 2
  local -a args=(--repo "$REPO" --title "$title" --body "$body")
  local label
  for label in "$@"; do
    args+=(--label "$label")
  done
  gh issue create "${args[@]}"
}

issue "Epic: Interactive 200 m grid map with 3D buildings (MVP)" "Track MVP map delivery." epic

issue "Define Warsaw 200 m grid generator and publish sample GeoJSON" "Ship data/scripts/generate_grid.py and sample grid for frontend. Owner: P1" data

issue "Add data/manifest.json and validate_data.py" "Machine-readable index and validation script. Owner: P1" data

issue "Document catalog slug to POI mapping in poi-schema.md" "Keep mapping table current as ETL adds sources. Owner: P1" data

issue "ETL: przystanki KM to poi/transit.geojson" "Fetch lokalizacja-przystanow-komunikacji-miejskiej. Owner: P2" data

issue "ETL: toalety, boiska, zajecia sportowe" "POI files for family/sport layers. Owner: P2" data

issue "ETL: monitoring AQ and kalendarz wydarzen" "Environment and culture inputs. Owner: P2" data

issue "Aggregate per-cell metrics and cell_metrics.json for 3 personas" "Scores 0-100 per persona. Owner: P3" data

issue "Commute heuristic: demo work pin and gray-out cells" "commute_heuristic_min in metrics. Owner: P3" data

issue "Add MapLibre and deck.gl; fullscreen map shell" "See docs/frontend/map-stack.md. Owner: P4" frontend

issue "Load grid from manifest; color cells by persona score" "Join grid GeoJSON and cell_metrics.json. Owner: P4" frontend

issue "3D buildings from vector style; pitch and zoom for demo" "Fill-extrusion with MapTiler/Protomaps. Owner: P4" frontend 3d

issue "POI layer with category filters" "Owner: P4" frontend

issue "Cell click: side panel with metrics and narrative" "Owner: P4" frontend

issue "Persona selector and layer toggles" "Owner: P4 + P5" frontend design

issue "Visual system: score ramp, typography, dark map UI" "Owner: P5" design

issue "Persona cards (Kasia / Marek / Ania and Tomek)" "Owner: P5" design

issue "Building 3D tint rules for MapLibre extrusion" "Owner: P5 + P4" design 3d

issue "Pitch deck and hero graphic; optional Blender GLB" "presentation/ folder. Owner: P5" design 3d

issue "Stretch: RSPO schools and metro stations import" "Owner: P2" data

issue "Add VITE_MAP_* to .env.example and docs/setup" "Owner: P4" chore

echo "Done. List: gh issue list --repo $REPO"
