import {GEDFamily} from './GEDFamily';
import {GEDPerson} from './GEDPerson';

export class GEDData {

    families: Array<GEDFamily>;
    persons: Array<GEDPerson>;

    constructor(families: Array<GEDFamily> = [], persons: Array<GEDPerson> = []){
        this.families = families;
        this.persons = persons;
    }

    addFamily(family: GEDFamily) {
        this.families.push(family);
    }

    addPerson(person: GEDPerson) {
        this.persons.push(person);
    }
}
