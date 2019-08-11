import {SimpleApplication} from '../engine/application/SimpleApplication';
import {GedcomPreparator} from '../objects/ged/GedcomPreparator';

import gedcom = require("parse-gedcom");

export class GEDApplication extends SimpleApplication {

    onStart(): void {
        document.getElementById('canvas').remove();
        const input = (<HTMLScriptElement>document.getElementById('gedcom')).text;
        const res = (<GedcomParser>gedcom).parse(input);
        const json = JSON.stringify(res, null, 2);

        const results = document.body.appendChild(document.createElement('pre'));
        results.style.overflow = 'auto';

        results.innerHTML = json;

        const preparator = new GedcomPreparator();
        preparator.init(input);
    }

    onUpdate(deltaTime: number): void {
    }

}
