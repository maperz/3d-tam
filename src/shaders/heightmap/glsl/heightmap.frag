#version 310 es

precision highp float;

in float v_pixelvalue;
in vec2 v_gridPosition;
in vec3 v_position;
in vec2 v_gridSize;

in vec3 v_normal;

out vec4 color;

uniform int u_invertColorRamp;
uniform sampler2D u_colorRamp;
uniform int u_useLights;
uniform int u_useSmoothRamp;
uniform int u_showSegmentLines;
uniform int u_numSegments;


void main() {

    vec3 lightPos = vec3(2, 2, 0);

    vec3 lightDir = normalize(lightPos - v_position);
    float lightFactor = clamp(dot(v_normal, lightDir), 0.3, 1.0);
    lightFactor = u_useLights != 0 ? lightFactor : 1.0;

    float uvValue = u_invertColorRamp > 0 ? 1.0 - v_pixelvalue : v_pixelvalue;
    float rampUV = uvValue;

    if(u_numSegments > 1) {

        if(u_useSmoothRamp == 0) {
            rampUV =  float(int(uvValue * float(u_numSegments))) / float(u_numSegments); 
        }
 
        if(u_showSegmentLines > 0)
        {
            int valuePercent = int(v_pixelvalue * 100.0f);
            if(valuePercent % (100 / u_numSegments) == 0) {
                lightFactor *= 0.9f;
            }
        }
    }

    color = texture(u_colorRamp, vec2(rampUV, 0)) * lightFactor;
    
    //color = vec4(v_pixelvalue, 0, 0, 1);
    
    //color = vec4(normalize(v_normal + vec3(1.0)), 1.0);
}
