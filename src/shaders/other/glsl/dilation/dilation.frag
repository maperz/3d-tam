#version 100
precision highp float;

varying vec2 v_uv;
uniform sampler2D inputData;

const float RADIUS = 3.0;
varying vec2 v_viewport;

vec3 getColor() {
    vec2 coord = vec2(gl_FragCoord.xy);
    vec3 nanColor = vec3(0, 0, 0);

    for(float x = -RADIUS; x <= RADIUS; ++x) {
        for(float y = -RADIUS; y <= RADIUS; ++y) {

            vec2 check = vec2(x, y) + coord;

            if(check.x < 0.0 || check.y < 0.0 || check.x >= v_viewport.x || check.y >= v_viewport.y) {
                continue;
            }

            vec2 check_uv = check / v_viewport;
            vec3 color = texture2D(inputData, check_uv).xyz;
            if( color != nanColor) {
                return color;
            }
        }
    }
    return nanColor;
}

void main() {
    //gl_FragColor = texture2D(inputData, v_uv);
    gl_FragColor = vec4(getColor(), 255);
}
