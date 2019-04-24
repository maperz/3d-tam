#version 100
precision highp float;

varying vec2 v_uv;
varying vec4 v_color;

uniform sampler2D heightmap;

void main() {
    //gl_FragColor = v_color;
    gl_FragColor = texture2D(heightmap, v_uv);
}
