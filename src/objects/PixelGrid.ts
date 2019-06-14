

export class PixelGrid {

    private readonly vertices = new Array<Float32Array>();
    private readonly indices = new Array<Uint16Array>();
    private readonly pixels = new Array<Int32Array>();
    private readonly chunkCount : number;

    private readonly MAX_INDICES_PER_CHUNK = 2**16 - 10; // - 10 For Tolerance

    private readonly tileSizeX: number;
    private readonly tileSizeY: number;

    constructor(private width: number,
                private height: number,
                private pixelX: number,
                private pixelY: number) {

        this.tileSizeX = width / (pixelX-1);
        this.tileSizeY = height / (pixelY-1);

        let indicesPerTile = 6;
        let tileCount = (pixelX-1) * (pixelY-1);
        let totalIndicesCount = indicesPerTile * tileCount;
        this.chunkCount = Math.ceil(totalIndicesCount / this.MAX_INDICES_PER_CHUNK);

        let tilesPerRow = (pixelX-1);
        let indicesPerRow = indicesPerTile * tilesPerRow;
        let rowsPerChunk = this.MAX_INDICES_PER_CHUNK / indicesPerRow;

        let fullRows = Math.floor(rowsPerChunk);
        let additionalTiles = Math.floor((rowsPerChunk - fullRows) * tilesPerRow);


        let currentFromX = 0;
        let currentFromY = 0;

        for(let chunk = 0; chunk < this.chunkCount; chunk++) {
            let endX = (currentFromX + additionalTiles) % pixelX;
            let endY = currentFromY + fullRows;
            this.createChunk(currentFromX, currentFromY, endX, endY);
            currentFromX = endX;
            currentFromY = endY;
        }
    }


    private createChunk(fromX: number, fromY: number, toX: number, toY: number) {
        console.log("Creating chunk from (" + fromX + "," + fromY +") to (" + toX + "," + toY +")");
        const vertices = [];
        const indices = [];
        const pixels = [];

        const offsetX = -this.width / 2.0 + fromX * this.tileSizeX;
        const offsetY = -this.height / 2.0 + fromY * this.tileSizeY;


        for (let y = fromY; y < toY; ++y) {
            for (let x = fromX; x < toX; ++x) {
                const positionX = offsetX + x * this.tileSizeX;
                const positionY = offsetY + y * this.tileSizeY;
                vertices.push(positionX, positionY);
                pixels.push(x, y);
            }
        }
        for (let y = fromY; y < toY-1; ++y) {
            for (let x = fromX; x < toX-1; ++x) {
                const i = x + this.pixelY * y;
                const iPlusRow = i + this.pixelY;

                // TODO: This is incomplete
                indices.push(i, i + 1);
                indices.push(i, iPlusRow);
                indices.push(iPlusRow, i + 1);
                //indices.push(iPlusRow, iPlusRow + 1);
                //indices.push(iPlusRow + 1, i + 1);
            }
        }

        this.vertices.push(new Float32Array(vertices));
        this.indices.push(new Uint16Array(indices));
        this.pixels.push(new Int32Array(pixels));
    }


    getChunkCount(): number {
        return this.chunkCount;
    }

    getVertices() : Float32Array[] {
        return this.vertices;
    }

    getIndices() : Uint16Array[] {
        return this.indices;
    }

    getPixels() : Int32Array[] {
        return this.pixels;
    }


}
