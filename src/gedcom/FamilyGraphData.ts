import { vec2 } from "gl-matrix";
import { TPAssert } from "../engine/error/TPException";
import { GraphData } from "../objects/GraphData";
import { FamilyGraph } from "./FamilyGraph";

export class FamilyGraphData extends GraphData {
  private readonly stringIds: Array<string>;
  private reverseStringIds: Map<string, number>;

  private readonly values: Array<number>;
  private readonly connections: Array<Set<number>>;

  private minDate: number = null;
  private maxDate: number = null;

  constructor(private graph: FamilyGraph) {
    super();

    this.stringIds = [];
    this.values = [];
    this.reverseStringIds = new Map();
    this.connections = [];

    for (let id of graph.persons.keys()) {
      this.reverseStringIds.set(id, this.stringIds.length);
      this.stringIds.push(id);
    }

    if (this.getCount() > 0) {
      this.calculateValues();
      this.calculateConnections();
    }
  }

  private calculateValues() {
    this.maxDate = null;
    this.maxDate = null;

    for (let p of this.graph.persons.values()) {
      if (p.bdate == null) {
        continue;
      } else if (this.minDate == null || p.bdate.getTime() < this.minDate) {
        this.minDate = p.bdate.getTime();
      } else if (this.maxDate == null || p.bdate.getTime() > this.maxDate) {
        this.maxDate = p.bdate.getTime();
      }
    }

    let range: number = this.maxDate - this.minDate;
    TPAssert(range > 0, "Range between min and max date cannot be zero!");

    console.log(
      `Age range loaded between ${this.minDate} and ${this.maxDate}.`
    );

    for (let p of this.graph.persons.values()) {
      let date = p.bdate ? p.bdate.getTime() : this.minDate;
      let value = (date - this.minDate) / range;

      // Clamp value so that we do not reach zero values.
      // This is achieved by adding 1ms to minDate.
      const minValue = 1 / range;
      value = Math.max(value, minValue);
      this.values.push(value);
    }
  }

  private getIndex(gedcomId: string): number {
    const id = this.reverseStringIds.get(gedcomId);
    TPAssert(id != null, `Could not find entry for gedcomId: '${gedcomId}'`);
    return id;
  }

  private calculateConnections() {
    for (let p of this.graph.persons.values()) {
      const conns = new Set<number>();

      if (p.getFather()) {
        conns.add(this.getIndex(p.getFather().getId()));
      }
      if (p.getMother()) {
        conns.add(this.getIndex(p.getMother().getId()));
      }

      for (let c of p.getChildren()) {
        conns.add(this.getIndex(c.getId()));
      }

      this.connections.push(conns);
    }
    console.log(this.connections);

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
    const stringId = this.stringIds[id];
    return this.graph.persons.get(stringId).getFullName();
  }

  getDate(id: number): Date {
    const value = this.values[id];
    const range = this.maxDate - this.minDate;
    const date = value * range + this.minDate;
    return new Date(date);
  }
}
