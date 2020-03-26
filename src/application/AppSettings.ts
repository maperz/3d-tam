export enum RenderMode {
    Dilate = 'Show Dilate',
    Push = 'Show Push',
    Pull = 'Show Pull',
    Density = 'Show Density',
    Scene3D = 'Show 3D Scene',
    Scene3DFlat = 'Show 3D Scene Flat',
    All = 'Show All',
    FDGDebug = 'FDG Debug',
}

export const ColorRamps = [
    "block.png", "Blues.png", "GnBu.png", "inferno.png", "turbo.png"
]

export const AppSettings = {

    resolution: 1024,

    pushIteration: 1,
    pullIteration: 10,
    densityIteration: 1,

    logDensity: false,
    mode : RenderMode.Scene3D,
    updateGraph: true,
    showPerson: false,
    numUpdates: 1,
    dilateRadius: 2,

    // Heightmap
    heightMapFactor: 2,
    heightMapResolution: 512,
    personSize: 0.5,

    // FDG
    attraction_stiffness : 0.02,
    attraction_length : 20,
    gravity_x : 0,
    gravity_y : 0,
    repulsionForce: 1000,

    // Rendering
    useLights: true,
    wireframe: false,
    colorRamp: "turbo.png",
    invertColorRamp: false,
    smoothRamp: true,
    numSegments: 0,
    showSegmentLines: true,
};
