#version 310 es

precision highp float;
in float v_isSelected;

out vec4 color;
void main() {

    if(v_isSelected != 0.0) {
        color = vec4(1, 0, 1, 1);
    }
    else {
        color = vec4(1);
    }
}
