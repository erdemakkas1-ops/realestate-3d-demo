"""Split the untextured Meshy building into PBR material groups.

public/models/building.glb has geometry only (POSITION + indices, no UVs, normals or
materials). This script classifies every triangle from its position and orientation
(glass, facade, slabs, soffits, podium stone, paving, lawn, foliage, roof, deck) and writes
public/models/building-colored.glb. The vertex buffer is reused unchanged; only the index
buffer is partitioned into one primitive per material, so the file size stays the same and
the floor hitbox ratios in src/lib/buildingConfig.ts remain valid.

Usage (requires numpy):  python scripts/colorize_building.py

The thresholds below are tuned to this specific model and are expressed in its own
coordinates (Y up; H = height ratio from the bottom of the bounding box).
"""

import json
import struct
from pathlib import Path

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/models/building.glb"
TARGET = ROOT / "public/models/building-colored.glb"

# name: (sRGB base colour, roughness, metalness)
MATERIALS = {
    "facade": ("#e6e0d4", 0.82, 0.0),
    "frame": ("#f4f2ec", 0.7, 0.0),
    "glass": ("#5d7386", 0.1, 0.55),
    "slab": ("#d6cfc1", 0.85, 0.0),
    "soffit": ("#dcd4c6", 0.9, 0.0),
    "stone": ("#c4b49b", 0.78, 0.0),
    "paving": ("#b3ada2", 0.9, 0.0),
    "grass": ("#5e7a42", 1.0, 0.0),
    "foliage": ("#4c6a37", 0.95, 0.0),
    "roof": ("#4a4d52", 0.5, 0.3),
    "deck": ("#a27e5c", 0.8, 0.0),
}
NAMES = list(MATERIALS)
ID = {name: i for i, name in enumerate(NAMES)}


def read_glb(path):
    data = path.read_bytes()
    json_len = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20:20 + json_len])
    bin_start = 20 + json_len + 8
    prim = gltf["meshes"][0]["primitives"][0]

    def accessor(index, dtype, width):
        acc = gltf["accessors"][index]
        view = gltf["bufferViews"][acc["bufferView"]]
        offset = bin_start + view.get("byteOffset", 0) + acc.get("byteOffset", 0)
        return np.frombuffer(data, dtype, acc["count"] * width, offset)

    positions = accessor(prim["attributes"]["POSITION"], np.float32, 3).reshape(-1, 3)
    index_type = {5125: np.uint32, 5123: np.uint16}[gltf["accessors"][prim["indices"]]["componentType"]]
    indices = accessor(prim["indices"], index_type, 1).reshape(-1, 3).astype(np.int64)
    return positions, indices


def envelope_recess(centers, normal_mask, axis, sign, u_axis, origin, cell=0.006, radius=0.03):
    """How far each face sits behind the local outer envelope of faces facing the same way."""
    idx = np.nonzero(normal_mask)[0]
    depth = sign * centers[idx, axis]
    ui = ((centers[idx, u_axis] - origin[u_axis]) / cell).astype(int)
    vi = ((centers[idx, 1] - origin[1]) / cell).astype(int)
    grid = np.full((vi.max() + 1, ui.max() + 1), -9.0)
    np.maximum.at(grid, (vi, ui), depth)
    r = int(radius / cell)
    padded = np.pad(grid, r, constant_values=-9.0)
    envelope = sliding_window_view(sliding_window_view(padded, 2 * r + 1, axis=1).max(-1), 2 * r + 1, axis=0).max(-1)
    recess = np.zeros(len(centers))
    recess[idx] = envelope[vi, ui] - depth
    return recess


def axis_alignment(centers, normals, areas, origin, cell=0.03):
    """Share of axis-aligned surface per voxel: architecture is boxy, trees are not."""
    vox = np.floor((centers - origin) / cell).astype(np.int64)
    _, inverse = np.unique(vox[:, 0] * 1_000_000 + vox[:, 1] * 1_000 + vox[:, 2], return_inverse=True)
    aligned = (np.abs(normals).max(1) > 0.92).astype(float)
    share = np.bincount(inverse, weights=areas * aligned) / np.maximum(np.bincount(inverse, weights=areas), 1e-12)
    return share[inverse]


def classify(positions, indices):
    a, b, c = (positions[indices[:, k]].astype(np.float64) for k in range(3))
    cross = np.cross(b - a, c - a)
    areas = np.linalg.norm(cross, axis=1)
    normals = cross / np.maximum(areas[:, None], 1e-15)
    centers = (a + b + c) / 3
    lo, hi = positions.min(0), positions.max(0)
    X, Z = centers[:, 0], centers[:, 2]
    H = (centers[:, 1] - lo[1]) / (hi[1] - lo[1])
    NY = normals[:, 1]

    vertical = np.abs(NY) < 0.45
    up, down = NY > 0.75, NY < -0.75
    in_tower = (X > -0.495) & (X < 0.595) & (np.abs(Z) < 0.395)
    in_podium = (np.abs(X) < 0.83) & (np.abs(Z) < 0.49)
    tower_band = (H > 0.24) & (H < 0.885)
    podium_band = H < 0.235

    recess = np.zeros(len(centers))
    for axis, u_axis in ((0, 2), (2, 0)):
        for sign in (1, -1):
            facing = vertical & (normals[:, axis] * sign > 0.7)
            recess = np.maximum(recess, envelope_recess(centers, facing & (tower_band | podium_band), axis, sign, u_axis, lo))

    mat = np.full(len(centers), ID["facade"])
    glass = vertical & (recess > 0.011) & (tower_band | podium_band)
    mat[glass] = ID["glass"]

    # Outermost tower faces are the white fins and slab edges; slightly recessed ones are render.
    mat[vertical & tower_band & ~glass & in_tower] = ID["frame"]
    mat[vertical & tower_band & ~glass & in_tower & (recess > 0.004)] = ID["facade"]
    mat[up & tower_band] = ID["slab"]
    mat[down & (tower_band | (H > 0.2))] = ID["soffit"]

    podium = podium_band & ~glass & in_podium
    mat[podium & vertical] = ID["stone"]
    mat[podium & down] = ID["soffit"]
    mat[up & (H > 0.06) & (H < 0.17)] = ID["slab"]                  # podium floors behind the glass
    mat[up & (H >= 0.17) & (H < 0.235)] = ID["paving"]              # podium roof terrace
    mat[up & (H >= 0.235) & (H < 0.3) & ~in_tower] = ID["grass"]    # planters on the podium roof

    ground = (H < 0.06) & up
    mat[ground] = ID["paving"]
    mat[ground & ((np.abs(X) > 0.8) | (np.abs(Z) > 0.44))] = ID["grass"]
    mat[(H < 0.06) & vertical & ~glass] = ID["paving"]

    crown = H > 0.93
    mat[crown] = ID["roof"]
    mat[crown & vertical & (recess > 0.011)] = ID["glass"]
    mat[(H > 0.86) & (H <= 0.93) & up] = ID["deck"]

    alignment = axis_alignment(centers, normals, areas / 2, lo)
    tower_core = in_tower & (H > 0.25) & (H < 0.885)
    crown_core = (X > -0.24) & (X < 0.32) & (np.abs(Z) < 0.31) & crown
    mat[(alignment < 0.42) & ~tower_core & ~crown_core] = ID["foliage"]
    return mat, areas


def srgb_to_linear(hex_colour):
    channels = [int(hex_colour[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in channels] + [1.0]


def write_glb(path, positions, indices, mat):
    position_bytes = positions.astype(np.float32).tobytes()
    index_bytes = b""
    accessors = [{"bufferView": 0, "componentType": 5126, "count": len(positions), "type": "VEC3",
                  "min": positions.min(0).astype(float).tolist(), "max": positions.max(0).astype(float).tolist()}]
    materials, primitives = [], []
    for i, name in enumerate(NAMES):
        faces = indices[mat == i]
        if not len(faces):
            continue
        accessors.append({"bufferView": 1, "byteOffset": len(index_bytes), "componentType": 5125,
                          "count": faces.size, "type": "SCALAR"})
        index_bytes += faces.astype(np.uint32).tobytes()
        colour, roughness, metalness = MATERIALS[name]
        # Double-sided: the Meshy surface has inconsistent winding, which otherwise leaves holes.
        materials.append({"name": name, "doubleSided": True, "pbrMetallicRoughness": {
            "baseColorFactor": srgb_to_linear(colour), "roughnessFactor": roughness, "metallicFactor": metalness}})
        primitives.append({"attributes": {"POSITION": 0}, "indices": len(accessors) - 1, "material": len(materials) - 1})

    binary = position_bytes + index_bytes
    binary += b"\0" * (-len(binary) % 4)
    gltf = {
        "asset": {"version": "2.0", "generator": "scripts/colorize_building.py"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "building"}],
        "meshes": [{"name": "building", "primitives": primitives}],
        "materials": materials, "accessors": accessors,
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(position_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": len(position_bytes), "byteLength": len(index_bytes), "target": 34963},
        ],
        "buffers": [{"byteLength": len(binary)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    with path.open("wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 28 + len(js) + len(binary)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(binary), 0x004E4942) + binary)


if __name__ == "__main__":
    positions, indices = read_glb(SOURCE)
    mat, areas = classify(positions, indices)
    write_glb(TARGET, positions, indices, mat)
    for i, name in enumerate(NAMES):
        print(f"{name:8s} {100 * areas[mat == i].sum() / areas.sum():5.1f}%")
    print(f"wrote {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size / 1e6:.1f} MB)")
