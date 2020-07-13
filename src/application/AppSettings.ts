export enum RenderMode {
  Constraint = "Show Constraint",
  Push = "Show Push",
  Pull = "Show Pull",
  Density = "Show Density",
  Scene3D = "Show 3D Scene",
  Scene3DFlat = "Show 3D Scene Flat",
  All = "Show All",
  FDGDebug = "FDG Debug",
}

export const ColorRamps = [
  "GnBu.png",
  "BrBG.png",
  "Blues.png",
  "BlackWhite.png",
  "inferno.png",
  "turbo.png",
];

export const AppSettings = {
  resolution: 1024,

  pushIteration: 1,
  pullIteration: 10,
  densityIteration: 1,

  showBoundaryBox: false,
  constraintToBoundary: true,
  mode: RenderMode.Scene3D,
  updateGraph: true,
  renderGraph: true,
  numUpdates: 1,
  dilateRadius: 2,

  smoothPullStep: true,

  // Heightmap
  heightMapFactor: 2,
  heightMapResolution: 512,

  // FDG
  attractionLength: 30,
  repulsionStrength: 30,
  gravity_x: 0,
  gravity_y: 0,

  constrainToFamily: true,
  famDistanceFactor: 300,
  velocityDecay: 0.6,

  // Rendering
  useLights: false,
  wireframe: false,
  colorRamp: "GnBu.png",
  personSize: 1,
  connectionSize: 1,
  invertColorRamp: true,
  smoothRamp: false,
  numSegments: 50,
  enableGraphDepthTest: true,
  showNames: false,
};
