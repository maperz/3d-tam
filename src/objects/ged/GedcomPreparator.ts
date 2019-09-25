import gedcom = require("parse-gedcom");
import {vec2} from 'gl-matrix';
import {TPAssert} from '../../engine/error/TPException';
import {GraphData} from '../GraphData';

interface PersonData {
    name: string;
    age: number;
}

class GedcomGraphData extends GraphData {

    constructor(private persons: Map<number, PersonData>, private connections: Map<number, Set<number>>)
    {
        super();
    }

    getCount(): number {
        return this.persons.size;
    }

    getNeighbours(id: number): Array<number> {
        return Array.from(this.connections.get(id));
    }

    getPosition(id: number): vec2 {
        return null;
    }

    getValue(id: number): number {
        return this.persons.get(id).age;
    }

    getName(id: number): string {
        return this.persons.get(id).name;
    }
}

export class GedcomPreparator {

    private personTable: Map<number, PersonData>;
    private idTranslateTable: Map<string, number>;
    private connectionTable: Map<number, Set<number>>;

    init(raw: string) {
        this.idTranslateTable = new Map<string, number>();
        this.personTable = new Map<number, PersonData>();
        this.connectionTable = new Map<number, Set<number>>();

        const parsed = (<GedcomParser>gedcom).parse(raw);
        this.buildPersonTable(parsed);


        this.buildConnectionTable(parsed);
    }

    private buildPersonTable(all: Array<GedcomObject>) {
        const people = all.filter(entry => entry.tag === 'INDI');

        let minYear = Infinity, maxYear = 0;
        const yearRegex = /(\d{4})/g;

        for(let id = 0; id < people.length; id++) {
            const p = people[id];
            this.idTranslateTable.set(p.pointer, id);
            const nameEntry = p.tree.find(e => e.tag === 'NAME');
            const birthEntry = p.tree.find(e => e.tag === 'BIRT');

            let age : number | null = null;
            // TODO: Read age and normalize
            if(birthEntry) {
                const treeEntry = birthEntry.tree.find(e => e.tag === 'DATE')
                const ageDescription : string | null = (treeEntry ? treeEntry.data : "").trim();
                const matches = yearRegex.exec(ageDescription);
                if(matches && matches.length > 0) {
                    age = Number.parseInt(matches[0]);
                    minYear = Math.min(age, minYear);
                    maxYear = Math.max(age, maxYear);
                }

            }

            const data = {name: nameEntry ? nameEntry.data : 'Unnamed', age: age}

            this.personTable.set(id, data);
            this.connectionTable.set(id, new Set());
        }

        const diff = maxYear - minYear > 0 ? maxYear - minYear : 1;
        for(let id = 0; id < people.length; id++) {
            let person = this.personTable.get(id);
            if(person.age == null) {
                // TODO: This edgecase should be carefully considered and maybe not set to maxAge
                person.age = minYear;
            }
            person.age = (person.age - minYear) / diff;
            // Don't set the age to zero since it won't be distinguishable from non values
            person.age = Math.max(person.age, 0.0000001);
            this.personTable.set(id, person);
        }
    }

    private getID(gedcomId: string): number {
        const id = this.idTranslateTable.get(gedcomId);
        TPAssert(id != null, `Could not find entry for gedcomId: '${gedcomId}'`);
        return id;
    }

    private createConnection(id1: number, id2: number) {
        this.connectionTable.get(id1).add(id2);
        this.connectionTable.get(id2).add(id1);
    }

    private buildConnectionTable(all: Array<GedcomObject>) {
        const families = all.filter(entry => entry.tag === 'FAM');
        for(let fam of families) {
            const parents = [];
            const father = fam.tree.find(e => e.tag === 'HUSB');
            if(father != null) {
                parents.push(this.getID(father.data));
            }
            const mother = fam.tree.find(e => e.tag === 'WIFE');
            if(mother != null) {
                parents.push(this.getID(mother.data));
            }

            if(parents.length == 2) {
                this.createConnection(parents[0], parents[1]);
            }

            for(let childEntry of fam.tree.filter(e => e.tag === 'CHIL')) {
                const child = this.getID(childEntry.data);
                for(const p of parents) {
                    this.createConnection(child, p);
                }
            }
        }
    }

    getGraphData(): GraphData {
        return new GedcomGraphData(this.personTable, this.connectionTable);
    }
}
