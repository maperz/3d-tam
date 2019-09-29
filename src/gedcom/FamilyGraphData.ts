import {vec2} from "gl-matrix";
import {TPAssert} from '../engine/error/TPException';
import {GraphData} from '../objects/GraphData';
import {FamilyGraph} from './FamilyGraph';

export class FamilyGraphData extends GraphData {


    private readonly stringIds : Array<string>;
    private reverseStringIds : Map<string, number>;

    private readonly values: Array<number>;
    private readonly connections: Array<Set<number>>;

    constructor(private graph: FamilyGraph)
    {
        super();

        this.stringIds = [];
        this.values = [];
        this.reverseStringIds = new Map();
        this.connections = [];

        for(let id of graph.persons.keys()) {
            this.reverseStringIds.set(id, this.stringIds.length)
            this.stringIds.push(id);
        }

        if(this.getCount() > 0) {
            this.calculateValues();
            this.calculateConnections();
        }
    }

    private calculateValues() {
        let minDate: number = null;
        let maxDate: number = null;

        for(let p of this.graph.persons.values()) {
            if(p.bdate == null) {
                continue;
            }

            if(minDate == null) {
                minDate = p.bdate.getTime();
            }
            else if(p.bdate.getTime() < minDate) {
                minDate = p.bdate.getTime();
            }

            if(maxDate == null) {
                maxDate = p.bdate.getTime();
            }
            else if(p.bdate.getTime() > maxDate) {
                maxDate = p.bdate.getTime();
            }
        }

        let range: number = maxDate - minDate;
        TPAssert(range > 0, "Range between min and max date cannot be zero!");

        for(let p of this.graph.persons.values()) {
            let date = p.bdate ? p.bdate.getTime() : minDate;
            let value = (date - minDate) / range;
            this.values.push(value);
        }
    }

    private getIndex(gedcomId: string): number {
        const id = this.reverseStringIds.get(gedcomId);
        TPAssert(id != null, `Could not find entry for gedcomId: '${gedcomId}'`);
        return id;
    }

    private calculateConnections() {
        for(let p of this.graph.persons.values()) {
            const conns = new Set<number>();

            if(p.getFather()) {
                conns.add(this.getIndex(p.getFather().getId()));
            }
            if(p.getMother()) {
                conns.add(this.getIndex(p.getMother().getId()));
            }

            for(let c of p.getChildren()) {
                conns.add(this.getIndex(c.getId()));
            }

            this.connections.push(conns);
        }
    }

    getCount(): number {
        return this.stringIds.length;
    }

    getNeighbours(id: number): Array<number> {
        return Array.from(this.connections[id]);

    }

    getPosition(id: number): vec2 {
        return null;
    }

    getValue(id: number): number {
        return this.values[id];
    }

    getName(id: number): string {
        const stringId = this.stringIds[id]
        return this.graph.persons.get(stringId).getFullName();
    }
}

