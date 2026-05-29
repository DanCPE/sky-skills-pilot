import type {
  BoxFoldingCube,
  BoxFoldingDifficulty,
  BoxFoldingFaceName,
  BoxFoldingFaceOrientation,
  BoxFoldingQuestion,
  BoxFoldingQuizResponse,
  BoxFoldingView,
} from "@/types";

type Vector = readonly [number, number, number];
type GridPos = readonly [number, number];
type FacePose = {
  right: Vector;
  up: Vector;
  normal: Vector;
};
type FoldedFace = {
  faceIdx: number;
  position: GridPos;
  faceName: BoxFoldingFaceName;
  orientation: BoxFoldingFaceOrientation;
  pose: FacePose;
};
type FoldResult = {
  cube: BoxFoldingCube;
  faceAssignments: Record<number, BoxFoldingFaceName>;
  faceOrientations: Record<number, BoxFoldingFaceOrientation>;
};
type StrategyName =
  | "visible_adjacent_swap"
  | "opposite_face_substitution"
  | "visible_orientation_error"
  | "visible_cycle_faces"
  | "swap_visible_with_hidden"
  | "visible_duplicate_face"
  | "visible_opposite_swap"
  | "handedness_error";
type WrongCandidate = {
  cube: BoxFoldingCube;
  strategyName: StrategyName;
  reason: string;
};

const FACE_NAMES: BoxFoldingFaceName[] = [
  "front",
  "back",
  "top",
  "bottom",
  "left",
  "right",
];

const IMAGE_SETS = {
  icons: [
    "/images/box-folding/icons/internet_1342057.png",
    "/images/box-folding/icons/startup-business_17593140.png",
    "/images/box-folding/icons/beer_2451585.png",
    "/images/box-folding/icons/spider_1123882.png",
    "/images/box-folding/icons/send_5517901.png",
    "/images/box-folding/icons/medical-kit_2400690.png",
    "/images/box-folding/icons/sex_6450061.png",
    "/images/box-folding/icons/random_3472377.png",
    "/images/box-folding/icons/dog_15477700.png",
    "/images/box-folding/icons/addiction_11288939.png",
  ],
  directional: [
    "/images/box-folding/directional/arrow_up.png",
    "/images/box-folding/directional/letter_F.png",
    "/images/box-folding/directional/letter_L.png",
    "/images/box-folding/directional/letter_P.png",
    "/images/box-folding/directional/letter_R.png",
    "/images/box-folding/directional/triangle_right.png",
    "/images/box-folding/directional/house.png",
    "/images/box-folding/directional/smiley.png",
  ],
};

const PATTERNS = [
  [
    [6, 4, 3, 0],
    [0, 2, 0, 0],
    [0, 1, 0, 0],
    [0, 5, 0, 0],
  ],
  [
    [6, 4, 0, 0],
    [0, 2, 3, 0],
    [0, 1, 0, 0],
    [0, 5, 0, 0],
  ],
  [
    [6, 4, 0, 0],
    [0, 2, 0, 0],
    [0, 1, 3, 0],
    [0, 5, 0, 0],
  ],
  [
    [6, 4, 0, 0],
    [0, 2, 0, 0],
    [0, 1, 0, 0],
    [0, 5, 3, 0],
  ],
  [
    [2, 0, 0, 0],
    [6, 1, 3, 0],
    [0, 5, 0, 0],
    [0, 4, 0, 0],
  ],
  [
    [2, 0, 0, 0],
    [6, 1, 0, 0],
    [0, 5, 3, 0],
    [0, 4, 0, 0],
  ],
  [
    [4, 0, 0, 0],
    [6, 2, 0, 0],
    [0, 1, 0, 0],
    [0, 5, 3, 0],
  ],
  [
    [4, 0, 0, 0],
    [6, 2, 0, 0],
    [0, 1, 3, 0],
    [0, 0, 5, 0],
  ],
  [
    [0, 2, 0, 0],
    [6, 1, 3, 0],
    [0, 5, 0, 0],
    [0, 4, 0, 0],
  ],
  [
    [0, 4, 0, 0],
    [6, 2, 0, 0],
    [0, 1, 3, 0],
    [0, 5, 0, 0],
  ],
  [
    [4, 0, 0, 0],
    [2, 0, 0, 0],
    [1, 3, 0, 0],
    [0, 5, 0, 0],
    [0, 6, 0, 0],
  ],
] as const;

const NORMAL_TO_FACE: Record<string, BoxFoldingFaceName> = {
  "0,1,0": "front",
  "0,-1,0": "back",
  "0,0,1": "top",
  "0,0,-1": "bottom",
  "-1,0,0": "left",
  "1,0,0": "right",
};

const UPRIGHT_FACE_POSES: Record<BoxFoldingFaceName, FacePose> = {
  front: { right: [1, 0, 0], up: [0, 0, 1], normal: [0, 1, 0] },
  back: { right: [1, 0, 0], up: [0, 0, -1], normal: [0, -1, 0] },
  top: { right: [1, 0, 0], up: [0, -1, 0], normal: [0, 0, 1] },
  bottom: { right: [1, 0, 0], up: [0, 1, 0], normal: [0, 0, -1] },
  left: { right: [0, -1, 0], up: [0, 0, -1], normal: [-1, 0, 0] },
  right: { right: [0, 1, 0], up: [0, 0, -1], normal: [1, 0, 0] },
};

export const BOX_FOLDING_CHOICE_VIEW: BoxFoldingView = {
  name: "45° Top View",
  rotX: -45,
  rotY: -45,
  visibleFaces: ["top", "front", "right"],
};

const OPPOSITE_FACE: Record<BoxFoldingFaceName, BoxFoldingFaceName> = {
  top: "bottom",
  bottom: "top",
  front: "back",
  back: "front",
  left: "right",
  right: "left",
};

const EXTRA_CHOICE_FRONT_NET_FACE_INDICES = [1, 2, 3, 4, 5, 6] as const;

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function item<T>(items: readonly T[], rng: () => number) {
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(items: readonly T[], rng: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function vectorKey(vector: Vector) {
  return vector.join(",");
}

function sameVector(a: Vector, b: Vector) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function negate(vector: Vector): Vector {
  return [-vector[0], -vector[1], -vector[2]];
}

function rotatePose(parentPose: FacePose, direction: GridPos): FacePose {
  const { right, up, normal } = parentPose;
  const [rowDelta, colDelta] = direction;

  if (rowDelta === -1 && colDelta === 0) {
    return { right, up: negate(normal), normal: up };
  }
  if (rowDelta === 1 && colDelta === 0) {
    return { right, up: normal, normal: negate(up) };
  }
  if (rowDelta === 0 && colDelta === -1) {
    return { right: normal, up, normal: negate(right) };
  }
  if (rowDelta === 0 && colDelta === 1) {
    return { right: negate(normal), up, normal: right };
  }

  throw new Error(`Unsupported fold direction: ${direction.join(",")}`);
}

function orientationFromImagePose(
  faceName: BoxFoldingFaceName,
  imagePose: FacePose,
): BoxFoldingFaceOrientation {
  const uprightPose = UPRIGHT_FACE_POSES[faceName];
  if (sameVector(imagePose.up, uprightPose.up) && sameVector(imagePose.right, uprightPose.right)) return "A";
  if (sameVector(imagePose.up, uprightPose.right) && sameVector(imagePose.right, negate(uprightPose.up))) return "B";
  if (sameVector(imagePose.up, negate(uprightPose.up)) && sameVector(imagePose.right, negate(uprightPose.right))) return "C";
  if (sameVector(imagePose.up, negate(uprightPose.right)) && sameVector(imagePose.right, uprightPose.up)) return "D";
  throw new Error(`Could not derive face orientation for ${faceName}`);
}

function applyOrientationToPose(
  pose: FacePose,
  orientation: BoxFoldingFaceOrientation,
): FacePose {
  if (orientation === "A") return pose;
  if (orientation === "B") return { right: negate(pose.up), up: pose.right, normal: pose.normal };
  if (orientation === "C") return { right: negate(pose.right), up: negate(pose.up), normal: pose.normal };
  return { right: pose.up, up: negate(pose.right), normal: pose.normal };
}

function orientationDegrees(orientation: BoxFoldingFaceOrientation) {
  return { A: 0, B: 90, C: 180, D: 270 }[orientation];
}

function netOptionSignature(
  netImages: Record<number, string>,
  netImageRotations: Record<number, number>,
) {
  return [1, 2, 3, 4, 5, 6]
    .map((faceIndex) => `${faceIndex}:${netImages[faceIndex]}:${netImageRotations[faceIndex] ?? 0}`)
    .join("|");
}

function visibleNetOptionSignature(
  visibleNetFaceIndices: number[],
  netImages: Record<number, string>,
  netImageRotations: Record<number, number>,
) {
  return visibleNetFaceIndices
    .map((faceIndex) => `${faceIndex}:${netImages[faceIndex]}:${netImageRotations[faceIndex] ?? 0}`)
    .join("|");
}

function visibleNetFaceIndicesForView(
  faceAssignments: Record<number, BoxFoldingFaceName>,
  view: BoxFoldingView,
) {
  return view.visibleFaces.map((faceName) => {
    const entry = Object.entries(faceAssignments).find(
      ([, assignedFaceName]) => assignedFaceName === faceName,
    );
    if (!entry) {
      throw new Error(`Could not find net face assigned to visible face ${faceName}.`);
    }
    return Number(entry[0]);
  });
}

function viewWithNetFaceAtFront(
  netFaceIndex: number,
  faceAssignments: Record<number, BoxFoldingFaceName>,
): BoxFoldingView {
  const cubeFace = faceAssignments[netFaceIndex];
  const baseView = {
    ...BOX_FOLDING_CHOICE_VIEW,
    name: `Net face #${netFaceIndex} front`,
    rotX: BOX_FOLDING_CHOICE_VIEW.rotX,
    rotY: BOX_FOLDING_CHOICE_VIEW.rotY,
  };

  if (cubeFace === "front") {
    return {
      ...baseView,
      anchorRotX: 0,
      anchorRotY: 0,
      visibleFaces: ["top", "front", "right"],
    };
  }
  if (cubeFace === "right") {
    return {
      ...baseView,
      anchorRotX: 0,
      anchorRotY: -90,
      visibleFaces: ["top", "right", "back"],
    };
  }
  if (cubeFace === "back") {
    return {
      ...baseView,
      anchorRotX: 0,
      anchorRotY: 180,
      visibleFaces: ["top", "back", "left"],
    };
  }
  if (cubeFace === "left") {
    return {
      ...baseView,
      anchorRotX: 0,
      anchorRotY: 90,
      visibleFaces: ["top", "left", "front"],
    };
  }
  if (cubeFace === "top") {
    return {
      ...baseView,
      anchorRotX: 90,
      anchorRotY: 0,
      visibleFaces: ["back", "top", "right"],
    };
  }

  return {
    ...baseView,
    anchorRotX: -90,
    anchorRotY: 0,
    visibleFaces: ["front", "bottom", "right"],
  };
}

function cloneNetImages(images: Record<number, string>) {
  return { ...images };
}

function emptyNetRotations() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<number, number>;
}

function createNetLevelDistractors(
  images: Record<number, string>,
  visibleNetFaceIndices: number[],
  rng: () => number,
) {
  const hiddenNetFaceIndices = [1, 2, 3, 4, 5, 6].filter(
    (faceIndex) => !visibleNetFaceIndices.includes(faceIndex),
  );
  const mutations: {
    name: string;
    reason: string;
    mutatedFaceIndices: number[];
    apply: (
      netImages: Record<number, string>,
      netImageRotations: Record<number, number>,
    ) => void;
  }[] = [];

  visibleNetFaceIndices.forEach((faceIndex) => {
    [90, 180, 270].forEach((degrees) => {
      mutations.push({
        name: `net_rotate_${faceIndex}_${degrees}`,
        reason: `Visible net face #${faceIndex} image is rotated before folding.`,
        mutatedFaceIndices: [faceIndex],
        apply: (_netImages, netImageRotations) => {
          netImageRotations[faceIndex] = degrees;
        },
      });
    });
  });

  visibleNetFaceIndices.forEach((first, firstIndex) => {
    visibleNetFaceIndices.slice(firstIndex + 1).forEach((second) => {
      mutations.push({
        name: `net_visible_swap_${first}_${second}`,
        reason: `Visible net faces #${first} and #${second} are swapped before folding.`,
        mutatedFaceIndices: [first, second],
        apply: (netImages) => {
          [netImages[first], netImages[second]] = [netImages[second], netImages[first]];
        },
      });
    });
  });

  visibleNetFaceIndices.forEach((visible) => {
    hiddenNetFaceIndices.forEach((hidden) => {
      mutations.push({
        name: `net_hidden_replace_${hidden}_to_${visible}`,
        reason: `Visible net face #${visible} is replaced with hidden net face #${hidden}.`,
        mutatedFaceIndices: [visible],
        apply: (netImages) => {
          netImages[visible] = netImages[hidden];
        },
      });
    });
  });

  if (visibleNetFaceIndices.length >= 3) {
    const [first, second, third] = visibleNetFaceIndices;
    mutations.push(
      {
        name: `net_visible_cycle_${first}_${second}_${third}`,
        reason: "The three visible net faces are cycled before folding.",
        mutatedFaceIndices: [first, second, third],
        apply: (netImages) => {
          [netImages[first], netImages[second], netImages[third]] = [
            netImages[third],
            netImages[first],
            netImages[second],
          ];
        },
      },
      {
        name: `net_visible_cycle_${third}_${second}_${first}`,
        reason: "The three visible net faces are cycled before folding.",
        mutatedFaceIndices: [first, second, third],
        apply: (netImages) => {
          [netImages[first], netImages[second], netImages[third]] = [
            netImages[second],
            netImages[third],
            netImages[first],
          ];
        },
      },
    );
  }

  const correctSignature = netOptionSignature(images, emptyNetRotations());
  const correctVisibleSignature = visibleNetOptionSignature(
    visibleNetFaceIndices,
    images,
    emptyNetRotations(),
  );
  const seen = new Set([correctSignature]);
  const seenVisible = new Set([correctVisibleSignature]);

  return shuffle(mutations, rng)
    .map((mutation) => {
      const netImages = cloneNetImages(images);
      const netImageRotations = emptyNetRotations();
      mutation.apply(netImages, netImageRotations);
      return {
        ...mutation,
        netImages,
        netImageRotations,
        signature: netOptionSignature(netImages, netImageRotations),
      };
    })
    .filter((candidate) => {
      const mutatesVisibleFace = candidate.mutatedFaceIndices.some((faceIndex) =>
        visibleNetFaceIndices.includes(faceIndex),
      );
      if (!mutatesVisibleFace) return false;
      if (seen.has(candidate.signature)) return false;
      const visibleSignature = visibleNetOptionSignature(
        visibleNetFaceIndices,
        candidate.netImages,
        candidate.netImageRotations,
      );
      if (seenVisible.has(visibleSignature)) return false;
      seen.add(candidate.signature);
      seenVisible.add(visibleSignature);
      return true;
    })
    .slice(0, 8);
}

function rotateOrientation(
  orientation: BoxFoldingFaceOrientation,
  steps: number,
): BoxFoldingFaceOrientation {
  const edges: BoxFoldingFaceOrientation[] = ["A", "B", "C", "D"];
  return edges[(edges.indexOf(orientation) + steps) % 4];
}

function getFacePositions(pattern: readonly (readonly number[])[]) {
  const positions = new Map<number, GridPos>();
  pattern.forEach((row, rowIndex) => {
    row.forEach((faceIdx, colIndex) => {
      if (faceIdx !== 0) positions.set(faceIdx, [rowIndex, colIndex]);
    });
  });
  return positions;
}

function analyzeNetFolding(pattern: readonly (readonly number[])[]) {
  const positions = getFacePositions(pattern);
  if (positions.size !== 6) {
    throw new Error(`Cube net must contain 6 faces, found ${positions.size}`);
  }
  const root = positions.get(1) ?? positions.get(Math.min(...positions.keys()));
  if (!root) throw new Error("Cube net must contain a root face");

  const posesByPosition = new Map<string, FacePose>([
    [root.join(","), { right: [1, 0, 0], up: [0, 0, 1], normal: [0, 1, 0] }],
  ]);
  const queue: GridPos[] = [root];
  const directions: GridPos[] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const parentPose = posesByPosition.get(`${row},${col}`)!;

    for (const direction of directions) {
      const nextRow = row + direction[0];
      const nextCol = col + direction[1];
      if (nextRow < 0 || nextRow >= pattern.length) continue;
      if (nextCol < 0 || nextCol >= pattern[nextRow].length) continue;
      if (pattern[nextRow][nextCol] === 0) continue;

      const key = `${nextRow},${nextCol}`;
      const nextPose = rotatePose(parentPose, direction);
      const existingPose = posesByPosition.get(key);
      if (existingPose) {
        const isConsistent =
          sameVector(existingPose.right, nextPose.right) &&
          sameVector(existingPose.up, nextPose.up) &&
          sameVector(existingPose.normal, nextPose.normal);
        if (!isConsistent) {
          throw new Error(`Inconsistent fold detected at net position ${key}`);
        }
        continue;
      }
      posesByPosition.set(key, nextPose);
      queue.push([nextRow, nextCol]);
    }
  }

  if (posesByPosition.size !== positions.size) {
    throw new Error("Cube net is disconnected; could not fold every face");
  }

  const usedFaceNames = new Set<BoxFoldingFaceName>();
  return [...positions.entries()]
    .sort(([first], [second]) => first - second)
    .map(([faceIdx, position]): FoldedFace => {
    const pose = posesByPosition.get(position.join(","));
    if (!pose) throw new Error("Cube net is disconnected");
    const faceName = NORMAL_TO_FACE[vectorKey(pose.normal)];
    if (!faceName) throw new Error(`Invalid face normal for face ${faceIdx}`);
    if (usedFaceNames.has(faceName)) {
      throw new Error(`Multiple net faces folded onto the same cube face: ${faceName}`);
    }
    usedFaceNames.add(faceName);
    return {
      faceIdx,
      position,
      faceName,
      orientation: orientationFromImagePose(faceName, pose),
      pose,
    };
  });
}

function foldCubeNet(
  pattern: readonly (readonly number[])[],
  images: Record<number, string>,
): FoldResult {
  const cube: BoxFoldingCube = {
    faces: Object.fromEntries(FACE_NAMES.map((face) => [face, ""])) as Record<
      BoxFoldingFaceName,
      string
    >,
    orientations: Object.fromEntries(FACE_NAMES.map((face) => [face, "A"])) as Record<
      BoxFoldingFaceName,
      BoxFoldingFaceOrientation
    >,
  };
  const faceAssignments = {} as Record<number, BoxFoldingFaceName>;
  const faceOrientations = {} as Record<number, BoxFoldingFaceOrientation>;

  for (const foldedFace of analyzeNetFolding(pattern)) {
    cube.faces[foldedFace.faceName] = images[foldedFace.faceIdx];
    cube.orientations[foldedFace.faceName] = foldedFace.orientation;
    faceAssignments[foldedFace.faceIdx] = foldedFace.faceName;
    faceOrientations[foldedFace.faceIdx] = foldedFace.orientation;
  }

  return { cube, faceAssignments, faceOrientations };
}

function cloneCube(cube: BoxFoldingCube): BoxFoldingCube {
  return {
    faces: { ...cube.faces },
    orientations: { ...cube.orientations },
  };
}

function setFaceOrientation(
  cube: BoxFoldingCube,
  faceName: BoxFoldingFaceName,
  orientation: BoxFoldingFaceOrientation,
) {
  cube.orientations[faceName] = orientation;
}

function copyFaceData(
  cube: BoxFoldingCube,
  target: BoxFoldingFaceName,
  source: BoxFoldingFaceName,
) {
  cube.faces[target] = cube.faces[source];
  cube.orientations[target] = cube.orientations[source];
}

function swapFaceData(
  cube: BoxFoldingCube,
  first: BoxFoldingFaceName,
  second: BoxFoldingFaceName,
) {
  [cube.faces[first], cube.faces[second]] = [cube.faces[second], cube.faces[first]];
  [cube.orientations[first], cube.orientations[second]] = [
    cube.orientations[second],
    cube.orientations[first],
  ];
}

function rotateVecZClockwise(vec: Vector): Vector {
  return [vec[1], -vec[0], vec[2]];
}

function rotateVecXForward(vec: Vector): Vector {
  return [vec[0], vec[2], -vec[1]];
}

function rotateCube(cube: BoxFoldingCube, rotateVec: (vec: Vector) => Vector) {
  const oldCube = cloneCube(cube);
  const nextCube = cloneCube(cube);
  const nextFaces = {} as Record<BoxFoldingFaceName, string>;
  const nextOrientations = {} as Record<BoxFoldingFaceName, BoxFoldingFaceOrientation>;

  for (const oldFaceName of FACE_NAMES) {
    const oldImagePose = applyOrientationToPose(
      UPRIGHT_FACE_POSES[oldFaceName],
      oldCube.orientations[oldFaceName],
    );
    const rotatedImagePose: FacePose = {
      right: rotateVec(oldImagePose.right),
      up: rotateVec(oldImagePose.up),
      normal: rotateVec(oldImagePose.normal),
    };
    const newFaceName = NORMAL_TO_FACE[vectorKey(rotatedImagePose.normal)];
    nextFaces[newFaceName] = oldCube.faces[oldFaceName];
    nextOrientations[newFaceName] = orientationFromImagePose(newFaceName, rotatedImagePose);
  }

  nextCube.faces = nextFaces;
  nextCube.orientations = nextOrientations;
  return nextCube;
}

function spinY(cube: BoxFoldingCube, degrees: 90 | 180 | 270) {
  let rotated = cloneCube(cube);
  for (let i = 0; i < degrees / 90; i++) {
    rotated = rotateCube(rotated, rotateVecZClockwise);
  }
  return rotated;
}

function tumbleX(cube: BoxFoldingCube, degrees: 90 | 180 | 270) {
  let rotated = cloneCube(cube);
  for (let i = 0; i < degrees / 90; i++) {
    rotated = rotateCube(rotated, rotateVecXForward);
  }
  return rotated;
}

function stateTuple(cube: BoxFoldingCube) {
  return FACE_NAMES.map(
    (face) => `${face}:${cube.faces[face]}:${orientationDegrees(cube.orientations[face])}:${cube.orientations[face]}`,
  )
    .sort()
    .join("|");
}

function getAllOrientations(cube: BoxFoldingCube) {
  const seen = new Set([stateTuple(cube)]);
  const queue = [cloneCube(cube)];
  const orientations = [cloneCube(cube)];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const angle of [90, 180, 270] as const) {
      for (const rotated of [spinY(current, angle), tumbleX(current, angle)]) {
        const key = stateTuple(rotated);
        if (!seen.has(key)) {
          seen.add(key);
          queue.push(rotated);
          orientations.push(rotated);
        }
      }
    }
  }

  return orientations;
}

function isRotationEquivalent(a: BoxFoldingCube, b: BoxFoldingCube) {
  const target = stateTuple(b);
  return getAllOrientations(a).some((orientation) => stateTuple(orientation) === target);
}

function visibleSignature(cube: BoxFoldingCube, view: BoxFoldingView) {
  return view.visibleFaces
    .map((face) => `${face}:${cube.faces[face]}:${orientationDegrees(cube.orientations[face])}`)
    .join("|");
}

function generateStrategyCandidates(
  strategyName: StrategyName,
  cube: BoxFoldingCube,
  view: BoxFoldingView,
  rng: () => number,
): WrongCandidate[] {
  const candidates: WrongCandidate[] = [];

  if (strategyName === "visible_adjacent_swap") {
    const preferredPairs: [BoxFoldingFaceName, BoxFoldingFaceName][] = [
      ["front", "right"],
      ["front", "top"],
      ["top", "right"],
    ];
    const pairs = preferredPairs.filter(
      ([first, second]) => view.visibleFaces.includes(first) && view.visibleFaces.includes(second),
    );
    view.visibleFaces.forEach((first, firstIndex) => {
      view.visibleFaces.slice(firstIndex + 1).forEach((second) => {
        if (!pairs.some((pair) => pair.includes(first) && pair.includes(second))) {
          pairs.push([first, second]);
        }
      });
    });
    pairs.forEach(([first, second]) => {
      const wrongCube = cloneCube(cube);
      swapFaceData(wrongCube, first, second);
      candidates.push({
        cube: wrongCube,
        strategyName,
        reason: `${first.toUpperCase()} and ${second.toUpperCase()} faces are swapped.`,
      });
    });
  }

  if (strategyName === "opposite_face_substitution") {
    shuffle(view.visibleFaces, rng).forEach((target) => {
      const source = OPPOSITE_FACE[target];
      const wrongCube = cloneCube(cube);
      copyFaceData(wrongCube, target, source);
      candidates.push({
        cube: wrongCube,
        strategyName,
        reason: `${target.toUpperCase()} is replaced by its opposite face, ${source.toUpperCase()}.`,
      });
    });
  }

  if (strategyName === "visible_orientation_error") {
    shuffle(view.visibleFaces, rng).forEach((faceName) => {
      shuffle([1, 2, 3], rng).forEach((step) => {
        const wrongCube = cloneCube(cube);
        setFaceOrientation(
          wrongCube,
          faceName,
          rotateOrientation(wrongCube.orientations[faceName], step),
        );
        candidates.push({
          cube: wrongCube,
          strategyName,
          reason: `${faceName.toUpperCase()} image is rotated incorrectly by ${step * 90} degrees.`,
        });
      });
    });
  }

  if (strategyName === "visible_cycle_faces") {
    const [first, second, third] = view.visibleFaces;
    const forward = cloneCube(cube);
    swapFaceData(forward, first, second);
    swapFaceData(forward, first, third);
    candidates.push({
      cube: forward,
      strategyName,
      reason: `Visible faces are cycled around the shown corner.`,
    });
    const backward = cloneCube(cube);
    swapFaceData(backward, first, third);
    swapFaceData(backward, first, second);
    candidates.push({
      cube: backward,
      strategyName,
      reason: `Visible faces are cycled around the shown corner.`,
    });
  }

  if (strategyName === "swap_visible_with_hidden") {
    const hiddenFaces = FACE_NAMES.filter((faceName) => !view.visibleFaces.includes(faceName));
    shuffle(view.visibleFaces, rng).forEach((visible) => {
      shuffle(hiddenFaces, rng).forEach((hidden) => {
        const wrongCube = cloneCube(cube);
        swapFaceData(wrongCube, visible, hidden);
        candidates.push({
          cube: wrongCube,
          strategyName,
          reason: `${visible.toUpperCase()} is swapped with hidden face ${hidden.toUpperCase()}.`,
        });
      });
    });
  }

  if (strategyName === "visible_duplicate_face") {
    shuffle(view.visibleFaces, rng).forEach((source) => {
      view.visibleFaces.forEach((target) => {
        if (target === source) return;
        const wrongCube = cloneCube(cube);
        copyFaceData(wrongCube, target, source);
        candidates.push({
          cube: wrongCube,
          strategyName,
          reason: `${target.toUpperCase()} duplicates ${source.toUpperCase()}.`,
        });
      });
    });
  }

  if (strategyName === "visible_opposite_swap") {
    shuffle(view.visibleFaces, rng).forEach((target) => {
      const opposite = OPPOSITE_FACE[target];
      const wrongCube = cloneCube(cube);
      swapFaceData(wrongCube, target, opposite);
      candidates.push({
        cube: wrongCube,
        strategyName,
        reason: `${target.toUpperCase()} is swapped with its opposite face ${opposite.toUpperCase()}.`,
      });
    });
  }

  if (strategyName === "handedness_error") {
    const sideFaces = view.visibleFaces.filter((faceName) => !["top", "bottom"].includes(faceName));
    if (sideFaces.length === 2) {
      const [first, second] = sideFaces;
      const wrongCube = cloneCube(cube);
      swapFaceData(wrongCube, first, second);
      swapFaceData(wrongCube, OPPOSITE_FACE[first], OPPOSITE_FACE[second]);
      candidates.push({
        cube: wrongCube,
        strategyName,
        reason: `${first.toUpperCase()} and ${second.toUpperCase()} reverse the cube handedness.`,
      });
    }
  }

  return candidates;
}

function chooseImages(difficulty: BoxFoldingDifficulty, rng: () => number) {
  const pool =
    difficulty === "easy"
      ? IMAGE_SETS.icons
      : difficulty === "medium"
        ? [...IMAGE_SETS.icons, ...IMAGE_SETS.directional]
        : IMAGE_SETS.directional;
  const chosen = shuffle(pool, rng).slice(0, 6);
  return Object.fromEntries(chosen.map((image, index) => [index + 1, image])) as Record<
    number,
    string
  >;
}

function createQuestion(
  difficulty: BoxFoldingDifficulty | "mixed",
  questionIndex: number,
): BoxFoldingQuestion {
  const seed = Date.now() + questionIndex * 1009 + Math.floor(Math.random() * 100000);
  const rng = random(seed);
  const activeDifficulty =
    difficulty === "mixed" ? item(["easy", "medium", "hard"] as const, rng) : difficulty;
  const pattern = item(PATTERNS, rng).map((row) => [...row]);
  const images = chooseImages(activeDifficulty, rng);
  const foldResult = foldCubeNet(pattern, images);
  const canonicalCube = foldResult.cube;
  const frontNetFaceSlots = [
    1,
    2,
    3,
    4,
    5,
    6,
    ...shuffle(EXTRA_CHOICE_FRONT_NET_FACE_INDICES, rng).slice(0, 3),
  ];
  const correctOptionIndex = Math.floor(rng() * frontNetFaceSlots.length);
  const usedWrongSignatures = new Set<string>();

  const options = frontNetFaceSlots.map((frontNetFaceIndex, index) => {
    const view = viewWithNetFaceAtFront(frontNetFaceIndex, foldResult.faceAssignments);
    const visibleNetFaceIndices = visibleNetFaceIndicesForView(
      foldResult.faceAssignments,
      view,
    );
    const label = String.fromCharCode(65 + index);

    if (index === correctOptionIndex) {
      return {
        id: crypto.randomUUID(),
        label,
        cube: cloneCube(canonicalCube),
        netImages: { ...images },
        netImageRotations: Object.fromEntries(
          Object.keys(images).map((faceIndex) => [Number(faceIndex), 0]),
        ) as Record<number, number>,
        view,
        isValidFold: true,
        strategyName: "correct_view",
        strategyReason: `Original net folded with net face #${frontNetFaceIndex} facing front.`,
      };
    }

    const candidate = createNetLevelDistractors(
      images,
      visibleNetFaceIndices,
      rng,
    ).find((wrongCandidate) => {
      if (usedWrongSignatures.has(wrongCandidate.signature)) return false;
      usedWrongSignatures.add(wrongCandidate.signature);
      return true;
    });

    if (!candidate) {
      throw new Error("Could not generate a visible net-level box-folding choice.");
    }

    return {
      id: crypto.randomUUID(),
      label,
      cube: cloneCube(canonicalCube),
      netImages: candidate.netImages,
      netImageRotations: candidate.netImageRotations,
      view,
      isValidFold: false,
      strategyName: candidate.name,
      strategyReason: `${candidate.reason} Displayed with net face #${frontNetFaceIndex} facing front.`,
    };
  });
  const correctOption = options[correctOptionIndex];

  return {
    id: crypto.randomUUID(),
    prompt: "Choose the only cube view that can be folded from the flat net.",
    difficulty: activeDifficulty,
    pattern,
    images,
    faceAssignments: foldResult.faceAssignments,
    faceOrientations: foldResult.faceOrientations,
    canonicalCube,
    options,
    correctOptionId: correctOption.id,
    explanation: "",
  };
}

export function generateBoxFoldingQuiz(
  count: number,
  mode: "learn" | "real",
  difficulty: BoxFoldingDifficulty | "mixed" = "mixed",
): BoxFoldingQuizResponse {
  const questions = Array.from({ length: count }, (_, index) =>
    createQuestion(difficulty, index),
  );
  const secondsPerQuestion = 54;

  return {
    questions,
    mode,
    timeLimit: mode === "real" ? count * secondsPerQuestion : undefined,
  };
}
