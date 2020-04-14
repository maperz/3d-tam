import { vec2 } from "gl-matrix";
import { TPAssert } from "../engine/error/TPException";
import { GraphData } from "../objects/GraphData";
import { FamilyGraph } from "./FamilyGraph";
import { Family } from "./Family";
import { Person } from "./Person";

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
      if(family.husband != null && family.wife != null) {
        name = `${family.husband.getSurname()}/${family.wife.getSurname()}`;
      }
      else if(family.wife != null) {
        name = family.wife.getSurname();
      }
      else if(family.husband != null) {
        name = family.husband.getSurname();
      }

      this.name = `Family - ${name}`;
      this.isFamily = true;
      this.gedId = family.getId();
      const persons = [family.wife, family.husband, ...family.children].filter(p => p != null);
      const bdays = persons.map(p => p.getBirthDate());
      const bdaysNumber = bdays.filter(b => b != null).map(b => b.getTime());
      const avg = bdaysNumber.reduce((a, b) => a + b, 0) / bdaysNumber.length;
      this.birthdate = new Date(avg);
    }
  }
}

export class FamilyGraphData extends GraphData {
  private minDate: number = null;
  private maxDate: number = null;
  private nodes = new Array<NodeObject>();

  constructor(private graph: FamilyGraph) {
    super();

    this.nodes = [];

    for (let [_, person] of graph.persons) {
      const id = this.nodes.length;
      this.nodes.push(new NodeObject(id, person, null));
    }

    for (let [_, family] of graph.families) {
      const id = this.nodes.length;
      this.nodes.push(new NodeObject(id, null, family));
    }

    if (this.nodes.length > 0) {
      this.calculateValues();
      this.calculateConnections();
    }
  }

  private calculateValues() {
    this.maxDate = null;
    this.maxDate = null;

    for (let node of this.nodes) {
      if (node.birthdate == null) {
        continue;
      } else if (this.minDate == null || node.birthdate.getTime() < this.minDate) {
        this.minDate = node.birthdate.getTime();
      } else if (this.maxDate == null || node.birthdate.getTime() > this.maxDate) {
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

  private getFamNode(gedId: string) {
    return this.nodes.filter(nd => nd.isFamily && nd.gedId == gedId)[0];
  }

  private getPersNode(gedId: string) {
    return this.nodes.filter(nd => !nd.isFamily && nd.gedId == gedId)[0];
  }

  private connect(a: NodeObject, b: NodeObject) {
    TPAssert(a != null && b != null);
    a.connections.push(b);
    b.connections.push(a);
  }


  private calculateConnections() {
    for (let [gedId, person] of this.graph.persons) {
      const personNode = this.getPersNode(gedId);
      for(let family of person.families) {
        if(family.wife === person || family.husband == person) {
          const familyNode = this.getFamNode(family.getId());
          personNode.link = familyNode;
          this.connect(personNode, familyNode);
          break;
        } 
      }
    }

    for (let [gedId, family] of this.graph.families) {
      const famNode = this.getFamNode(gedId);
      for(let child of family.children) {
        const childNode = this.getPersNode(child.getId());
        this.connect(famNode, childNode);
      }
    }
  }

  getCount(): number {
    return this.nodes.length;
  }

  getEdges(id: number): Array<number> {
    return this.nodes[id].connections.map(no => no.id);
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
    if(this.nodes[id].link == null) {
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
