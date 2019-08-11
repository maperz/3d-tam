import gedcom = require("parse-gedcom");
import {TPAssert} from '../../engine/error/TPException';

export class GedcomPreparator {

    private personTable: Map<number, string>;
    private idTranslateTable: Map<string, number>;
    private connectionTable: Map<number, Set<number>>;

    init(raw: string) {
        this.idTranslateTable = new Map<string, number>();
        this.personTable = new Map<number, string>();
        this.connectionTable = new Map<number, Set<number>>();

        const parsed = (<GedcomParser>gedcom).parse(raw);
        this.buildPersonTable(parsed);

        console.log(this.personTable);
        console.log(this.idTranslateTable);

        this.buildConnectionTable(parsed);

        console.log(this.connectionTable);
    }

    private buildPersonTable(all: Array<GedcomObject>) {
        const people = all.filter(entry => entry.tag === 'INDI');
        for(let id = 0; id < people.length; id++) {
            const p = people[id];
            this.idTranslateTable.set(p.pointer, id);
            const nameEntry = p.tree.find(e => e.tag === 'NAME');
            this.personTable.set(id, nameEntry ? nameEntry.data : 'Unnamed');
            this.connectionTable.set(id, new Set());
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
        console.log(families);
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
}
