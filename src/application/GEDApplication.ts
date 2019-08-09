import {SimpleApplication} from '../engine/application/SimpleApplication';
import {GEDParser} from '../ged/GEDParser';

export class GEDApplication extends SimpleApplication {

    onStart(): void {
        document.getElementById('canvas').remove();
        const gedcom = (<HTMLScriptElement>document.getElementById('gedcom')).text;
        const parser = new GEDParser();
        const res = parser.parseData(gedcom);
        console.log(res);
    }

    onUpdate(deltaTime: number): void {
    }

}
