import { Profiler } from "inspector";
import { Family } from "./Family";
import { FamilyGraph } from "./FamilyGraph";
import { FemaleNames, MaleNames } from "./Names";

export enum Gender {
  MALE = 1,
  FEMALE = 2,
}

export class Person {
  private readonly id: string;
  private readonly surname: string;
  private readonly bplace: string;
  private readonly ddate: number;

  children: Array<Person>;
  families: Array<Family>;

  givenname: string;

  sex: Gender;
  bdate: Date;
  randomName: string = null;

  constructor(
    id: string,
    givenname: string,
    surname: string,
    bdate: Date,
  ) {
    this.id = id;
    this.sex = Gender.FEMALE;
    this.givenname = givenname;
    this.surname = surname;
    this.bdate = bdate;
    this.bplace = null;
    this.ddate = null;
    //this.motherId = motherId; // DEPR
    //this.fatherId = fatherId; // DEPR

    this.families = []; // list of families this person belongs to
    this.children = [];
  }

  getId(): string {
    return this.id;
  }

  getSurname(): string {
    if (this.surname) {
      return this.surname;
    }
    return this.givenname != null ? this.givenname : "";
  }

  getRandomizedName() {
    if (this.randomName == null) {
      const names = this.sex == Gender.FEMALE ? FemaleNames : MaleNames;
      const randomIndex = Math.trunc(Math.random() * (names.length - 1));
      this.randomName = names[randomIndex];
    }

    return this.randomName;
  }

  getFullName() {
    if (this.givenname && this.surname) {
      return this.givenname + " " + this.surname;
    }

    if (this.givenname) {
      return this.givenname;
    }

    if (this.surname) {
      return this.surname;
    }

    return null;
  }

  getMother(): Person {
    for (let f of this.families) if (f.children.includes(this)) return f.wife;
    return null;
  }

  getFather(): Person {
    for (let f of this.families)
      if (f.children.includes(this)) return f.husband;
    return null;
  }

  getChildren(): Array<Person> {
    let ch = new Array<Person>();
    for (let f of this.families)
      if (this == f.husband || this == f.wife) ch = ch.concat(f.children);
    return ch;
  }

  getSpouses() {
    let sp = [];
    for (let f of this.families)
      if (this == f.husband && f.wife) sp = sp.concat(f.wife);
      else if (this == f.wife && f.husband) sp = sp.concat(f.husband);
    return sp;
  }

  getBirthDate(): Date {
    return this.bdate;
  }
}
