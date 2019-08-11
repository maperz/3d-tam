interface GedcomParser {
    parse(input: string): Array<GedcomObject>;
}

interface GedcomObject {
    pointer: string;
    tag: string;
    data: string;
    tree: Array<GedcomObject>
}
