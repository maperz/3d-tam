import { GUI } from "dat.gui";
import { AppSettings, RenderMode, ColorRamps } from "./AppSettings";

export class AppGUI {
  init(
    restartCallback: Function,
    inputLoadedCallback: Function,
    colorRampChanged: Function
  ) {
    const gui: GUI = new GUI({ width: 300 });
    gui.domElement.style.zIndex = "100";
    gui.useLocalStorage = true;
    gui.remember(AppSettings);
    gui
      .add(AppSettings, "mode", [
        RenderMode.All,
        RenderMode.Constraint,
        RenderMode.Push,
        RenderMode.Pull,
        RenderMode.Density,
        RenderMode.Scene3D,
        RenderMode.Scene3DFlat,
        RenderMode.FDGDebug
      ])
      .name("Render Mode");
    gui
      .add(AppSettings, "resolution", 1024, 4096)
      .name("Resolution")
      .onChange(value => {
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

    gui.add(AppSettings, "dilateRadius", 0, 10, 1).name("Dilate Radius");

    gui.add(AppSettings, "smoothPullStep").name("Smooth Pull");

    const heightMapSettings = gui.addFolder("HeightMap Settings");
    heightMapSettings
      .add(AppSettings, "heightMapFactor", 1, 5, 0.2)
      .name("Height");
    heightMapSettings
      .add(AppSettings, "heightMapResolution", 128, 2048).name("Resolution (3D Map)")
      .onChange(value => {
        const log = Math.log2(value);
        if (!Number.isInteger(log)) {
          // Only support power of 2
          AppSettings.heightMapResolution = Math.pow(2, Math.ceil(log));
        }
      });

    const iterationSettings = gui.addFolder("Display Settings");
    iterationSettings
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
        14
      ])
      .name("Push Iteration")
      .onChange(value => {
        AppSettings.pushIteration = Math.min(
          Math.log2(AppSettings.resolution),
          value
        );
      });
    iterationSettings
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
        14
      ])
      .name("Pull Iteration")
      .onChange(value => {
        AppSettings.pullIteration = Math.min(
          Math.log2(AppSettings.resolution),
          value
        );
      });
    iterationSettings
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
        14
      ])
      .name("Density Iteration")
      .onChange(value => {
        AppSettings.densityIteration = Math.min(
          Math.log2(AppSettings.resolution),
          value
        );
      });
    iterationSettings.add(AppSettings, "logDensity").name("Log Density");

    const fdgSettings = gui.addFolder("FDG Settings");

    fdgSettings
      .add(AppSettings, "attraction_stiffness")
      .name("Attraction Stiffness");
    fdgSettings
      .add(AppSettings, "attraction_length", 0.1)
      .name("Attraction Length");

    fdgSettings.add(AppSettings, "gravity_x", 0, 10, 0.01).name("GravityX");
    fdgSettings.add(AppSettings, "gravity_y", 0, 10, 0.01).name("GravityY");
    fdgSettings
      .add(AppSettings, "numUpdates", 0, 300, 1)
      .name("Number of updates");
    fdgSettings
      .add(AppSettings, "repulsionForce", 0, 10000, 10)
      .name("Repulsion Force");

    const restartObject = {
      Restart: () => {
        restartCallback();
      }
    };
    const fileLoader = {
      loadFile: () => {
        document.getElementById("upload").click();
      }
    };

    const colorRampLoader = {
      loadColorRamp: () => {
        document.getElementById("color-ramp-upload").click();
      }
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

    const renderFolder = gui.addFolder("Render Settings");
    renderFolder.add(AppSettings, "useLights").name("Use Lights");
    renderFolder.add(AppSettings, "wireframe").name("Show Wireframe");
    renderFolder.add(AppSettings, "renderGraph").name("Render Graph");
    renderFolder.add(AppSettings, "personSize", 0, 3, 0.1).name("Person Size");
    renderFolder.add(AppSettings, "connectionSize", 0, 5, 1).name("Connection Size");

    renderFolder.add(AppSettings, "colorRamp", ColorRamps).onChange(url => {
      colorRampChanged(`images/${url}`);
    }).name("Color Ramp");

    renderFolder.add(AppSettings, "invertColorRamp").name("Invert Ramp");
    renderFolder.add(AppSettings, "numSegments").name("Num Segments");
    renderFolder.add(AppSettings, "showSegmentLines").name("Show Segments");
    renderFolder.add(AppSettings, "showNames").name("Display Names");

    function loadColorRamp(e) {
      if (e.target.files && e.target.files[0]) {
        var img = document.querySelector('img');
        colorRampChanged(URL.createObjectURL(this.files[0]));
      }
    }
    renderFolder.add(AppSettings, "smoothRamp").name("Smooth Ramp");

    renderFolder.add(colorRampLoader, "loadColorRamp").name("Load ColorRamp");

    gui.add(fileLoader, "loadFile").name("Load GED file");
    gui.add(restartObject, "Restart");

    document
    .getElementById("upload")
    .addEventListener("change", readSingleFile, false);

    document
    .getElementById("color-ramp-upload")
    .addEventListener("change",loadColorRamp, false);


  }
}
