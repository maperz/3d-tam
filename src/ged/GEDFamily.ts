import {GEDPerson} from './GEDPerson';

export class GEDFamily {

    children: Array<GEDPerson>;

    constructor(public husband: GEDPerson, public wife: GEDPerson) {
        this.children = new Array<GEDPerson>();
    }

    addChild(child: GEDPerson) {
        this.children.push(child)
    }

}
