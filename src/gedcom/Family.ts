import { Person } from "./Person";

export class Family {
  husband: Person = null;
  wife: Person = null;
  children: Person[] = [];
  
  constructor(private id: string) {}

  getId() {
    return this.id;
  }
}
