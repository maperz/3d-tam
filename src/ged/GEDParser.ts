import {TPAssert} from '../engine/error/TPException';
import {GEDData} from './GEDData';
import {GEDFamily} from './GEDFamily';
import {GEDPerson} from './GEDPerson';


class GEDLine {
    constructor(public level: number, public first: string, public second: string = '')
    {}
}

export class GEDParser {
    private persons: Array<GEDPerson>;
    private families: Array<GEDFamily>;


    private init() {
        this.persons = new Array<GEDPerson>();
        this.families = new Array<GEDFamily>();
    }

    private assert(cond: boolean, text: string) {
        TPAssert(cond, 'GEDCOM File not correct: ' + text);
    }

    private parseHeader(ls: GEDLine[]) {
        const head = ls.pop();
        this.assert(head.level === 0, 'Invalid Header');
        this.assert(head.first === 'HEAD', 'Invalid Header');

        this.parseToNextEntry(ls);
    }

    private parseToNextEntry(ls: GEDLine[]) {
        let parsing = true;
        while(parsing && ls.length > 0) {
            const line = ls.pop();
            if(line.level == 0) {
                ls.push(line);
                parsing = false;
            }
        }
    }

    private parseBody(ls: GEDLine[]) {
        console.log(ls);

        while (ls.length > 0) {
            const line = ls[ls.length - 1];
            if(line.second === 'TRLR') {
                ls.pop();
                return;
            }
            if(line.second === 'INDI') {
                this.parsePerson(ls);
            }
            if(line.second === 'FAM') {
                this.parseFamily(ls)
            }
            ls.pop();
            this.parseToNextEntry(ls);
        }
    }

    private parsePerson(ls: GEDLine[]) {
        console.log(ls);
        this.parseToNextEntry(ls);
    }

    private parseFamily(ls: GEDLine[]) {
        console.log(ls);
        this.parseToNextEntry(ls);
    }


    parseData(src: string) : GEDData {
        this.init();

        const lines = src.split(/\r?\n/).map(line => line.trim());
        const lineStack: GEDLine[] = []
        let i = lines.length
        while (i--) {
            const line = lines[i];
            if (line.length != 0) {
                const tokens = line.split(' ');
                this.assert(tokens.length >= 2, '2 tokens per line required');
                const level = Number.parseInt(tokens[0]);
                const first = tokens[1];
                let second = '';

                for(let i = 2; i < tokens.length; i++) {
                    second += ' ' + tokens[i];
                }
                second.trim();
                const gedLine = new GEDLine(level, first, second)
                lineStack.push(gedLine);
            }
        }

        console.log(lineStack);

        this.parseHeader(lineStack);
        this.parseBody(lineStack);

        return new GEDData(this.families, this.persons);
    }


}
