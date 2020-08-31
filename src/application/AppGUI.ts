import { GUI } from "dat.gui";
import { AppSettings, RenderMode, ColorRamps } from "./AppSettings";

export class AppGUI {
  colorRampChanged: Function;
  resetUserScaling: Function;
  generateInput: Function;

  private gui: GUI;

  init(
    restartCallback: Function,
    inputLoadedCallback: Function,
    colorRampChanged: Function,
    resetUserScaling: Function,
    generateInput: Function,
  ) {
    this.colorRampChanged = colorRampChanged;
    this.resetUserScaling = resetUserScaling;
    this.generateInput = generateInput;

    const gui: GUI = new GUI({ width: 320, closeOnTop: true });
    gui.domElement.id = "dat-gui";
    gui.domElement.style.zIndex = "1000";
    gui.useLocalStorage = true;
    gui.remember(AppSettings);

    gui
      .add(AppSettings, "resolution", 1024, 4096)
      .name("Resolution")
      .onChange((value) => {
        const log = Math.log2(value);
        if (!Number.isInteger(log)) {
          // Only support power of 2
          AppSettings.resolution = Math.pow(2, Math.ceil(log));
        }
      });

    gui
      .add(AppSettings, "updateGraph")
      .name("Update Graph")
      .setValue(true);

    gui.add(AppSettings, "numUpdates", 0, 300, 1).name("Number of updates");

    const layoutGUI = gui.addFolder("Layout");
    this.initLayoutSettings(layoutGUI);

    const meshGUI = gui.addFolder("Mesh Settings");
    this.initMeshSettings(meshGUI);

    const gradientGUI = gui.addFolder("Gradient Settings");
    this.initGradientSettings(gradientGUI);

    const displayGUI = gui.addFolder("Display Settings");
    this.initDisplaySettings(displayGUI);

    const debugGUI = gui.addFolder("Debug Settings");
    this.initDebugSettings(debugGUI);

    const fileLoader = {
      loadFile: () => {
        document.getElementById("upload").click();
      },
    };

    function readSingleFile(e) {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const contents = String(reader.result);
        inputLoadedCallback(contents);
      };
      reader.readAsText(file);
    }

    gui.add(fileLoader, "loadFile").name("Load GED file");

    const restartObject = {
      Restart: () => {
        restartCallback();
      },
    };
    gui.add(restartObject, "Restart");

    document
      .getElementById("upload")
      .addEventListener("change", readSingleFile, false);

    this.gui = gui;
  }

  initGradientSettings(settings: GUI) {
    settings.add(AppSettings, "dilateRadius", 1, 100, 1).name("Dilate Radius");
    settings.add(AppSettings, "smoothPullStep").name("Smooth Pull");

    settings.add(AppSettings, "numSegments", 0, 100, 1).name("Num Segments");

    settings.add(AppSettings, "smoothRamp").name("Smooth Segment Colors");

    settings
      .add(AppSettings, "colorRamp", ColorRamps)
      .onChange(
        function(url) {
          this.colorRampChanged(`images/${url}`);
        }.bind(this)
      )
      .name("Color Ramp");

    let loadColorRamp = function(e) {
      if (e.target.files && e.target.files[0]) {
        this.colorRampChanged(URL.createObjectURL(e.target.files[0]));
      }
    }.bind(this);

    document
      .getElementById("color-ramp-upload")
      .addEventListener("change", loadColorRamp, false);
    settings.add(AppSettings, "invertColorRamp").name("Invert Ramp");

    const colorRampLoader = {
      loadColorRamp: () => {
        document.getElementById("color-ramp-upload").click();
      },
    };
    settings.add(colorRampLoader, "loadColorRamp").name("Load ColorRamp");
  }

  initDisplaySettings(display: GUI) {
    display.add(AppSettings, "useLights").name("Use Lights");
    display.add(AppSettings, "renderGraph").name("Render Graph");
    display.add(AppSettings, "personSize", 0, 3, 0.1).name("Person Size");
    display.add(AppSettings, "connectionSize", 0, 5, 1).name("Connection Size");
    display.add(AppSettings, "showNames").name("Display Names");
    display.add(AppSettings, "enableGraphDepthTest").name("Graph DepthTest");
  }

  initLayoutSettings(layout: GUI) {
    layout.add(AppSettings, "attractionLength", 0.1).name("Attraction Length");

    /*layout
      .add(AppSettings, "attractionStrength", 0, 100)
      .name("Attraction Strength");
    */

    layout
      .add(AppSettings, "repulsionStrength", 0, 100)
      .name("Repulsion Strength");

    layout
      .add(AppSettings, "constrainToFamily")
      .name("Enable Family Constraints");

    layout
      .add(AppSettings, "famDistanceFactor", 1)
      .name("Family distance Fac.");
    layout.add(AppSettings, "velocityDecay", 0, 1, 0.05).name("VelocityDecay");

    layout.add(AppSettings, "maxRepulsionCalculation", 0, 50000, 600).name("Max Repulsions");

    layout
      .add(AppSettings, "constraintToBoundary")
      .name("Constaint to Boundary");

    const resetScalingObject = {
      Reset: function() {
        this.resetUserScaling();
      }.bind(this),
    };
    layout.add(resetScalingObject, "Reset").name("Reset Scaling");
  }

  initMeshSettings(mesh: GUI) {
    mesh.add(AppSettings, "heightMapFactor", 0, 5, 0.2).name("Height");
    mesh
      .add(AppSettings, "heightMapResolution", 128, 2048)
      .name("Mesh Tiles")
      .onChange((value) => {
        const log = Math.log2(value);
        if (!Number.isInteger(log)) {
          // Only support power of 2
          AppSettings.heightMapResolution = Math.pow(2, Math.ceil(log));
        }
      });
  }

  initDebugSettings(debug: GUI) {
    debug
      .add(AppSettings, "mode", [
        RenderMode.All,
        RenderMode.Constraint,
        RenderMode.Push,
        RenderMode.Pull,
        RenderMode.Density,
        RenderMode.Scene3D,
        RenderMode.Scene3DFlat,
        RenderMode.FDGDebug,
      ])
      .name("Render Mode");
    debug
      .add(AppSettings, "pushIteration", [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
      ])
      .name("Push Iteration")
      .onChange((value) => {
        AppSettings.pushIteration = Math.min(
          Math.log2(AppSettings.resolution),
          value
        );
      });
    debug
      .add(AppSettings, "pullIteration", [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
      ])
      .name("Pull Iteration")
      .onChange((value) => {
        AppSettings.pullIteration = Math.min(
          Math.log2(AppSettings.resolution),
          value
        );
      });
    debug
      .add(AppSettings, "densityIteration", [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
      ])
      .name("Density Iteration")
      .onChange((value) => {
        AppSettings.densityIteration = Math.min(
          Math.log2(AppSettings.resolution),
          value
        );
      });
    debug.add(AppSettings, "showBoundaryBox").name("Show Boundary");
    debug.add(AppSettings, "wireframe").name("Show Wireframe");
    debug.add(AppSettings, "noPostProcessing").name("No postprocessing");
    debug.add(AppSettings, "obfuscateNames").name("Obfuscate Names");

    const generateInputObject = {
      Generate: function() {
        this.generateInput();
      }.bind(this),
    };
    debug.add(generateInputObject, "Generate").name("Generate Input");
  }

  notifyChange() {
    this.gui.updateDisplay();
  }
}
