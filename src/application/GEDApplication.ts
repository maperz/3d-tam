import {SimpleApplication} from '../engine/application/SimpleApplication';
import {FamilyGraph} from '../gedcom/FamilyGraph';


export class GEDApplication extends SimpleApplication {

    onStart(): void {
        this.loadInitialGraphData();
    }

    loadInitialGraphData(){
        // Load initial Gedcom file
        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", "/gedcom/default.ged");
        xhttp.send();
        const app = this;
        xhttp.onload = e => {
            app.onLoadedGedcom(xhttp.responseText);
        };
    }

    onLoadedGedcom(input: string) {
        const graph = new FamilyGraph();
        graph.loadGedcom(input);

        graph.estimateMissingDates(20);
        //
        //console.log(input);

        console.log(graph);
    }

    onUpdate(deltaTime: number): void {
    }

}
