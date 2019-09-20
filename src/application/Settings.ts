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

export const APP_SETTINGS = {
    pushIteration: 1,
    pullIteration: 10,
    densityIteration: 0,
    logDensity: false,
    mode : RenderMode.Scene3D,
    height: 2,
    updateGraph: true,
    showPerson: false,
    numUpdates: 1,

    // FDG
    attraction_stiffness : 0.02,
    attraction_length : 20,
    gravity_x : 0,
    gravity_y : 0,
};
