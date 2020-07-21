import { Person, Gender } from "./Person";
import { Family } from "./Family";
import { TPAssert } from "../engine/error/TPException";

class GraphData {
  persons: Map<string, Person> = new Map();
  families: Map<string, Family> = new Map();
}

export class GraphGenerator {
  static generate(layers: number, childPerFamily: number): GraphData {
    const result = new GraphData();

    if (childPerFamily <= 0) {
      childPerFamily = 4;
    }

    const root = this.createFamily(result);
    this.addChildren(root, childPerFamily, result, layers);

    return result;
  }

  private static createFamily(data: GraphData) {
    const familyId = data.families.size;
    const familyName = `Fam - ${familyId}`;
    const family = new Family(familyName);
    data.families.set(familyName, family);
    return family;
  }

  private static createPerson(data: GraphData) {
    const personId = data.persons.size;
    const personName = `Person ${personId}`;
    const person = new Person(personName, "Name", "Name", null);
    person.sex = Gender.FEMALE;
    data.persons.set(personName, person);
    return person;
  }

  private static addChildren(
    family: Family,
    amount: number,
    result: GraphData,
    level: number
  ) {
    for (let c = 0; c < amount; c++) {
      const person = this.createPerson(result);
      person.bdate = new Date(1990 + level, 1, 1);  
      family.children.push(person);

      if (level > 0) {
        const newFamily = this.createFamily(result);
        newFamily.wife = person;
        this.addChildren(newFamily, amount, result, level - 1);
      }
    }
  }
}
