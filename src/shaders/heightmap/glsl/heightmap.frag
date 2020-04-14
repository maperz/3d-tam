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

    const vec3 ambientColor = vec3(0);
    const vec3 specularColor = vec3(0);
    const vec3 lightPos = vec3(0, 5, 5);
    const float Ka = 4.0;
    const float Kd = 1.0;
    const float Ks = 1.0;
    const float shininessVal = 1.0;

    float rampUV = u_invertColorRamp > 0 ? 1.0 - v_pixelvalue : v_pixelvalue;

    if(u_useSmoothRamp == 0 && u_numSegments > 1) {
        rampUV =  float(int(rampUV * float(u_numSegments))) / float(u_numSegments); 
    }

    vec3 diffuseColor = texture(u_colorRamp, vec2(rampUV, 0)).xyz;

    if(u_showSegmentLines > 0 && u_numSegments > 1)
    {
        int valuePercent = int(v_pixelvalue * 100.0f);
        if(valuePercent % (100 / u_numSegments) == 0) {
            diffuseColor *= 0.9f;
        }
    }

    if (u_useLights == 0) {
        color = vec4(diffuseColor, 1);
        return;
    }

    vec3 N = normalize(v_normal);
    vec3 L = normalize(lightPos - v_position);
    float lightFactor = max(dot(N, L), 0.0);
    float specular = 0.0;

    if(lightFactor > 0.0) {
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-v_position);
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, shininessVal);
    }

    lightFactor = mix(0.6, 1.0, lightFactor);

    color = vec4(Ka * ambientColor +
                      Kd * lightFactor * diffuseColor +
                      Ks * specular * specularColor, 1.0);
}
