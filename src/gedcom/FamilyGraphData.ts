import { vec2 } from "gl-matrix";
import { TPAssert } from "../engine/error/TPException";
import { GraphData } from "../objects/GraphData";
import { FamilyGraph } from "./FamilyGraph";
import { Family } from "./Family";
import { Person } from "./Person";
import { Profiler } from "../engine/Profiler";

class NodeObject {
  public isFamily: boolean;
  public birthdate: Date;
  public value: number;
  public connections = new Array<NodeObject>();
  public link: NodeObject;
  public gedId: string;
  public name: string;

  constructor(public id: number, person: Person, family: Family) {
    TPAssert(person == null || family == null, "Cannot be both.");

    if (person != null) {
      this.isFamily = false;
      this.birthdate = person.getBirthDate();
      this.gedId = person.getId();
      this.name = person.getFullName();
    } else {
      let name = "N/A";
      
      if (family.husband != null) {
        name = family.husband.getSurname();
      }
      else if (family.wife != null) {
        name = family.wife.getSurname();
      } 

      this.name = `Family - ${name}`;
      this.isFamily = true;
      this.gedId = family.getId();
      const persons = [family.wife, family.husband, ...family.children].filter(
        (p) => p != null
      );
      const bdays = persons.map((p) => p.getBirthDate());
      const bdaysNumber = bdays
        .filter((b) => b != null)
        .map((b) => b.getTime());
      const avg = bdaysNumber.reduce((a, b) => a + b, 0) / bdaysNumber.length;
      this.birthdate = new Date(avg);
    }
  }
}

export class FamilyGraphData extends GraphData {
  private minDate: number = null;
  private maxDate: number = null;
  private nodes = new Array<NodeObject>();
  private familyNodes = new Map<String, NodeObject>();
  private personNodes = new Map<String, NodeObject>();

  constructor(private graph: FamilyGraph) {
    super();

    this.nodes = [];

    for (let [gedId, person] of graph.persons) {
      const id = this.nodes.length;
      const personNode = new NodeObject(id, person, null);
      this.nodes.push(personNode);
      this.personNodes[gedId] = personNode;
    }

    for (let [gedId, family] of graph.families) {
      const id = this.nodes.length;
      const familyNode = new NodeObject(id, null, family);
      this.nodes.push(familyNode);
      this.familyNodes[gedId] = familyNode;
    }

    if (this.nodes.length > 0) {
      Profiler.evaluate("Calculate Values", this.calculateValues.bind(this));
      Profiler.evaluate("Calculate Connections", this.calculateConnections.bind(this));
    }
  }

  private calculateValues() {
    this.maxDate = null;
    this.maxDate = null;

    for (let node of this.nodes) {
      if (node.birthdate == null) {
        continue;
      } else if (
        this.minDate == null ||
        node.birthdate.getTime() < this.minDate
      ) {
        this.minDate = node.birthdate.getTime();
      } else if (
        this.maxDate == null ||
        node.birthdate.getTime() > this.maxDate
      ) {
        this.maxDate = node.birthdate.getTime();
      }
    }

    let range: number = this.maxDate - this.minDate;
    TPAssert(range > 0, "Range between min and max date cannot be zero!");

    console.log(
      `Age range loaded between ${this.minDate} and ${this.maxDate}.`
    );

    for (let node of this.nodes) {
      let date = node.birthdate ? node.birthdate.getTime() : this.minDate;
      let value = (date - this.minDate) / range;

      // Clamp value so that we do not reach zero values.
      // This is achieved by adding 1ms to minDate.
      const minValue = 1 / range;
      value = Math.max(value, minValue);
      node.value = value;
    }
  }

  private getFamNode(id: string) {
    return this.familyNodes[id];
  }

  private getPersNode(id: string) {
    return this.personNodes[id];
  }

  private connect(a: NodeObject, b: NodeObject) {
    TPAssert(a != null && b != null);
    a.connections.push(b);
    b.connections.push(a);
  }

  private calculateConnections() {

    for (let [famId, family] of this.graph.families) {
      const familyNode = this.getFamNode(famId);
      if (family.wife) {
        const wifeNode = this.getPersNode(family.wife.getId());
        this.connect(wifeNode, familyNode);
      }

      if (family.husband) {
        const husbandNode = this.getPersNode(family.husband.getId());
        this.connect(husbandNode, familyNode);
      }

      for (let child of family.children) {
        const childNode = this.getPersNode(child.getId());
        this.connect(familyNode, childNode);
      }
    }
  }

  getCount(): number {
    return this.nodes.length;
  }

  getEdges(id: number): Array<number> {
    return this.nodes[id].connections.map((no) => no.id);
  }

  getPosition(id: number): vec2 {
    return null;
  }

  getValue(id: number): number {
    return this.nodes[id].value;
  }

  getName(id: number): string {
    return this.nodes[id].name;
  }

  getFamily(id: number): number {
    if (this.nodes[id].link == null) {
      return -1;
    }
    return this.nodes[id].link.id;
  }

  getType(id: number): number {
    return this.nodes[id].isFamily ? 1 : 0;
  }

  getDate(id: number): Date {
    return this.nodes[id].birthdate;
  }
}
