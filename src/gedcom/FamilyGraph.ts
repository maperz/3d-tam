///////////////////////////////////////////////////////////////////////////////
// class Person, class FamilyGraph
// * data container for a relational gedcom graph

import {Family} from './Family';
import {Gender, Person} from './Person';
import {GraphGenerator} from './GraphGenerator';

export class FamilyGraph
{
    persons: Map<string, Person>;
    families: Map<string, Family>;

    constructor()
    {
        this.persons = new Map();
        this.families = new Map();
    }

    generate(nodes: number, childrenPerFamily: number) {
        var data = GraphGenerator.generate(nodes, childrenPerFamily);
        this.persons = data.persons;
        this.families = data.families;
    }

    loadGedcom(fileContent: string)
    {
        let gedcom = {
            "persons" : new Map<string, Person>(),
            "families" : new Map<string, Family>()
        };

        let graph = this;

        let lines = fileContent.split("\n");

        let current_pers = null;
        let current_fam = null;
        let current_parentType = null;

        for (let i = 0; i < lines.length; i++)
        {
            let line = lines[i].trim();
            let tokens = line.split(" ");
            if (tokens[0] == "0" && tokens.length > 2)
            {
                let nodeType = tokens[2].trim();
                if (nodeType == "INDI")
                {
                    let id = tokens[1].toString();
                    current_pers = new Person(id, null, null, null);
                    gedcom.persons.set(id, current_pers);
                }
                else if (nodeType == "FAM")
                {
                    let id = tokens[1];
                    current_fam = new Family(id);
                    gedcom.families.set(id, current_fam);
                }
                else
                {
                    current_pers = null;
                    current_fam = null;
                }

            }
            //-------------------------------------------------------------
            else if (Number(tokens[0]) == 1)
            {
                let nodeType = tokens[1].trim();
                current_parentType = nodeType;

                //-------------------------- encounterd while parsing PERSONS
                nodeType = tokens[1].trim();
                if (current_parentType == "NAME" && current_pers && current_pers.getFullName() == null)
                {
                    for (let j = 2; j < tokens.length; j++)
                    {
                        if (current_pers.surname == null && tokens[j].startsWith("/"))      // extract surname
                            current_pers.surname = tokens[j].replace(/\//g, " ").trim();
                        else if (current_pers.givenname == null)                            // given name
                            current_pers.givenname = tokens[j].trim();
                    }
                }
                else if (nodeType == "SEX" && current_pers)
                {
                    let sex = tokens[2].trim();
                    current_pers.sex = sex == "M" ? Gender.MALE : Gender.FEMALE;
                }
                //-------------------------- encounterd while parsing FAMILIES
                else if (nodeType == "HUSB")
                {
                    // important to trim trailing \r from id token!!
                    let person = gedcom.persons.get(tokens[2].trim());
                    if (person) {
                        // create bidirectional link between gedcom and person
                        person.families.push(current_fam);
                        current_fam.husband = person;
                    }
                }
                else if (nodeType == "WIFE")
                {
                    let person = gedcom.persons.get(tokens[2].trim());
                    if (person) {
                        // create bidirectional link between gedcom and person
                        person.families.push(current_fam);
                        current_fam.wife = person;
                    }
                }
                else if (nodeType == "CHIL")
                {
                    let id = tokens[2].trim()
                    if (!gedcom.persons.get(id))
                        gedcom.persons.set(id, new Person(id, null, null, null));
                    let person = gedcom.persons.get(id);

                    // create bidirectional link between gedcom and person
                    person.families.push(current_fam);
                    current_fam.children.push(person);
                }
            }
            //-------------------------------------------------------------
            else if (Number(tokens[0]) == 2)
            {
                if (tokens[1] == "DATE" && tokens.length > 2)
                {
                    let date = null;
                    let datestr = tokens.slice(2).join(" ");

                    let cleanstr = datestr
                        .toLowerCase()
                        // unwanted characters and words
                        .replace(/\./g, " ").replace("?"," ").replace(","," ")
                        .replace("abt"," ").replace("before", " ").replace("bef"," ")
                        .replace("undefined "," ").replace("undef "," ")
                        .replace("aft "," ")
                        .replace("to (\d)*"," ").replace("from"," ")
                        .replace("um "," ")
                        // common german wording replacements
                        .replace("jänner","jan").replace("januar ","jan ")
                        .replace("feber","feb").replace("februar ","feb ")
                        .replace("märz","mar").replace("mai","may")
                        .replace("juni","jun").replace("juli","jul")
                        .replace("okt","oct").replace("dez","dec")
                        .replace("ä","a")
                        .trim();

                    // add day number in case only month and year is given
                    if (cleanstr.split(" ").filter(function(v,i,a){ return v != ""; }).length == 2
                        && /^[jfmasond]/.test(cleanstr))
                        cleanstr = "1 "+cleanstr;

                    // convert to timestap in ms
                    let datems = Date.parse(cleanstr);

                    if (!isFinite(datems))
                    {
                        // parsing error -> parse ourselves
                        let a = cleanstr.split(" ").filter(function(v,i,a){ return v != ""; });
                        if (a.length > 2)
                        {
                            let customstr = a[2].trim() + "-" + a[1].trim() + "-" + a[0].trim();
                            datems = Date.parse(customstr);
                            if (isFinite(datems))
                                date = new Date(datems);
                            else {
                                //console.log("Can't parse custom date string '"+customstr+"' ("+cleanstr+")("+datestr+")");
                            }
                        }
                        else
                        {
                            //console.log("Can't parse date string '"+datestr+"' ("+cleanstr+")");
                            date = null; // unknown date
                        }
                    }
                    else
                        date = new Date(datems);

                    // set date to event
                    if (current_parentType == "BIRT") current_pers.bdate = date;
                    else if (current_parentType == "DEAT") current_pers.ddate = date;
                }
            }
        }

        console.log("Loaded " + gedcom.persons.size + " persons in " + gedcom.families.size + " families");

        graph.persons = gedcom.persons;
        graph.families = gedcom.families;

        return this;
    }

    estimateMissingDates(procreationAge: number)
    {

        let newUpdatesCounter = 0;
        let stillMissingCounter = 0;

        let updated = true;
        while (updated)
        {
            // continue estimation until nothing was updated anymore
            updated = false;
            this.persons.forEach( function(p){
                if (p.getBirthDate() == null)    // missing date of birth
                {
                    let mother = p.getMother();
                    let father = p.getFather();

                    // birthday of youngest parent
                    let pbdate = null;
                    let mbdate = mother ? mother.bdate : null;
                    let fbdate = father ? father.bdate : null;
                    if (mbdate != null && fbdate == null) pbdate = mbdate;
                    else if (mbdate == null && fbdate != null) pbdate = fbdate;
                    else if (mbdate && fbdate) pbdate = (mbdate > fbdate) ? mbdate : fbdate;

                    // birthday of oldest child
                    let cbdate = null;
                    let children = p.getChildren();
                    for (let c of children)
                        if (cbdate == null)
                            cbdate = c.bdate;
                        else if (c.bdate && c.bdate < cbdate)
                            cbdate = c.bdate;

                    // birthday of oldest spouse
                    let spbdate = null;
                    let spouses = p.getSpouses();
                    for (let sp of spouses)
                        if (spbdate == null)
                            spbdate = sp.bdate;
                        else if (sp.bdate && sp.bdate < spbdate)
                            spbdate = sp.bdate;


                    // estimate based on parent or child birthdates
                    if (pbdate != null || cbdate != null)
                    {
                        if (pbdate != null && cbdate == null)
                        {
                            p.bdate = new Date(pbdate.getTime());
                            p.bdate.setFullYear(p.bdate.getFullYear() + procreationAge);
                        }
                        else if (pbdate == null && cbdate != null)
                        {
                            p.bdate = new Date(cbdate.getTime());
                            p.bdate.setFullYear(p.bdate.getFullYear() - procreationAge);
                        }
                        else if (pbdate != null && cbdate != null)
                        {
                            p.bdate = new Date((pbdate.getTime() + cbdate.getTime())/2);
                        }

                        newUpdatesCounter++;
                        //console.log("Missing birth date of "+ p.getFullName() + " was estimated "+p.bdate);
                        updated = true;
                    }
                    // neither parents nor childs are known - estimate based on spouse's bdate
                    else if (spbdate != null)
                    {
                        newUpdatesCounter++;
                        p.bdate = new Date(spbdate.getTime());  // assume person is of the same age as his oldest spouse
                        updated = true;
                    }
                }
            });
        }

        // check who's left
        this.persons.forEach( function(p){
            if (p.bdate == null)    // missing date of birth
            {
                stillMissingCounter++;
                //console.log("Still missing birth date of "+ p.getFullName());
            }
        });

        console.log(`Estimated new age for: ${newUpdatesCounter}. Still missing: ${stillMissingCounter}`);
    }
}
