import { canvas } from "./Context";


export class Recorder {

    private screenshotButton : HTMLImageElement;
    private recordButton: HTMLImageElement;
    private recordTimer: HTMLElement;
    private downloadAnchor: HTMLElement;

    private recording = false;
    private recordTime: number = 0;

    private recorder: MediaRecorder = null;
    private chunks = [];

    private recordStartImage = "icons/record_start.svg";
    private recordStopImage = "icons/record_stop.svg";

    init() {
        this.screenshotButton = document.getElementById("screenshotButton") as HTMLImageElement;
        this.recordButton = document.getElementById("recordButton") as HTMLImageElement;
        this.recordTimer = document.getElementById("recorded-time");

        this.screenshotButton.onclick = this.screenshot.bind(this);
        this.recordButton.onclick = this.record.bind(this);

        this.downloadAnchor = document.createElement('a');
        this.downloadAnchor.style.visibility = "hidden";

        const stream = (canvas as any).captureStream(25);

        const options = { mimeType: 'video/webm' };
        this.recorder = new MediaRecorder(stream, options);

        this.recorder.ondataavailable = function(e) {
            this.chunks.push(e.data);
        }.bind(this);

        this.recorder.onstop = function(e) {
            var blob = new Blob(this.chunks, { 'type' : 'video/webm' });
            var data = URL.createObjectURL(blob);
            this.saveAsFile("Recording.webm", data);
        }.bind(this);
    }

    private record() {
        if(this.recording) {
            this.stopRecording();
        }
        else {
            this.startRecording();
        }
    }

    private saveAsFile(name: string, dataUrl: string) {
        this.downloadAnchor.setAttribute('download', name);
        this.downloadAnchor.setAttribute('href', dataUrl);
        this.downloadAnchor.click();
    }

    private updateRecordTimeDisplay() {
        let sec = (this.recordTime % 60).toString();
        sec = sec.length == 2 ? sec : `0${sec}`;
        const min = Math.floor(this.recordTime / 60);

        this.recordTimer.innerText = `${min}:${sec}`;
    }

    private startRecording() {
        this.recording = true;
        this.recordTimer.style.display = "inline";
        this.recordTime = 0;
        this.recordButton.src = this.recordStopImage;

        this.updateRecordTimeDisplay();
        let recordTimer = setInterval(function(){
            if(!this.recording){
              clearInterval(recordTimer);
            }
            this.recordTime++;
            this.updateRecordTimeDisplay();
          }.bind(this), 1000);

        this.recorder.start();
    }

    private stopRecording() {
        this.recordButton.src = this.recordStartImage;
        this.recordTimer.style.display = "none";
        this.recording = false;

        this.recorder.stop();
        //this.recorder.requestData();
    }

    private screenshot() {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        this.saveAsFile("Screenshot.png", image);
    }


}