# 3D Topographic Annotated Map

## Build requirements:

Node v10.15.3

## Run requirements

WebGL 2.0 Compute (extension) 

At the time of developing this application, only Chrome Beta (dev. on Version 84) had support for the extension.
For further details see https://github.com/9ballsyndrome/WebGL_Compute_shader.

## Build steps:

To build and serve the project use the following commands in the root directory.
(Next to package.json).

```
npm install
npm run watch
```

To run the application open ```localhost:4000``` and the page should be displayed properly.

The application source (TypeScript) is located under the ```src/``` directory.
After running ```npm run``` (or ```npm build```) the TypeScript source files are transpiled into the ```dist/``` directory
and further served by a webpack development server.
