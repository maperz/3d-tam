#version 100
precision highp float;

uniform sampler2D inputData;
varying vec2 v_uv;

varying vec2 v_inputSize;
varying vec2 v_outputSize;

const float NEIGHBOURHOOD_SIZE = 2.0;

const vec4 NAN_VALUE = vec4(0, 0, 0, 0);

vec4 getAveragedColor(vec2 coord) {

    vec2 roundedCoord = coord * NEIGHBOURHOOD_SIZE;

    vec4 valueSum = vec4(0,0,0,0);
    int numValues = 0;
    for(float dx = 0; dx < NEIGHBOURHOOD_SIZE; ++dx) {
        for(float dy = 0; dy < NEIGHBOURHOOD_SIZE; ++dy) {
            vec2 pos = roundedCoord + vec2(dx, dy);
            vec2 uv = pos / v_inputSize;
            vec4 value = texture2D(inputData, uv);

            if(value != NAN_VALUE) {
                valueSum += value;
                numValues++;
            }
        }
    }

    if(numValues > 0){
        return valueSum / numValues;
    }
    else {
        return NAN_VALUE;
    }

}

void main() {
    gl_FragColor = getAveragedColor(gl_FragCoord.xy);
}
