import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Folder, Save, Trash2, Code, Edit, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';

interface ShaderParams {
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
  tintR: number;
  tintG: number;
  tintB: number;
  saturation: number;
  distortion: number;
  blur: number;
  text: string;
  iconSize: number;
  iconColorR: number;
  iconColorG: number;
  iconColorB: number;
  glassMode: 'light' | 'dark';
  shadowIntensity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  cornerRadius: number;
  chromaticAberration: number;
  shape: 'rectangle' | 'circle' | 'star' | 'hexagon' | 'donut';
  donutThickness: number;
  starPoints: number;
  starInnerRadius: number;
}

interface SavedDesign {
  id: string;
  name: string;
  params: ShaderParams;
  backgroundUrl: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedDesignsManagerProps {
  currentParams: ShaderParams;
  currentBackgroundUrl: string;
  onLoadDesign: (params: ShaderParams, backgroundUrl: string) => void;
}

const STORAGE_KEY = 'liquidGlass_savedDesigns';

export default function SavedDesignsManager({
  currentParams,
  currentBackgroundUrl,
  onLoadDesign
}: SavedDesignsManagerProps) {
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [designName, setDesignName] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');

  // Load saved designs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const designs = JSON.parse(saved);
        setSavedDesigns(designs);
      } catch (error) {
        console.error('Failed to load saved designs:', error);
      }
    }
  }, []);

  // Save designs to localStorage whenever they change
  useEffect(() => {
    if (savedDesigns.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDesigns));
    }
  }, [savedDesigns]);

  const handleSaveDesign = () => {
    if (!designName.trim()) {
      toast.error('Please enter a name for your design');
      return;
    }

    const newDesign: SavedDesign = {
      id: Date.now().toString(),
      name: designName.trim(),
      params: currentParams,
      backgroundUrl: currentBackgroundUrl,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setSavedDesigns(prev => [newDesign, ...prev]);
    setDesignName('');
    setIsSaveDialogOpen(false);
    toast.success(`Design "${newDesign.name}" saved successfully`);
  };

  const handleDeleteDesign = (id: string) => {
    const design = savedDesigns.find(d => d.id === id);
    setSavedDesigns(prev => prev.filter(d => d.id !== id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDesigns.filter(d => d.id !== id)));
    toast.success(`Design "${design?.name}" deleted`);
  };

  const handleLoadDesign = (design: SavedDesign) => {
    onLoadDesign(design.params, design.backgroundUrl);
    setIsOpen(false);
    toast.success(`Design "${design.name}" loaded`);
  };

  const handleExportCode = (design: SavedDesign) => {
    const code = generateComponentCode(design);
    setGeneratedCode(code);
    setSelectedDesign(design);
    setIsCodeDialogOpen(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard');
  };

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDesign?.name || 'glass-component'}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const generateComponentCode = (design: SavedDesign): string => {
    const { params } = design;
    const shapeValue = ['rectangle', 'circle', 'star', 'hexagon', 'donut'].indexOf(params.shape);
    
    return `// Glass Effect Component - ${design.name}
// Generated from Liquid Glass Editor
// Full WebGL shader implementation with all effects

import { useEffect, useRef, useCallback } from 'react';

export default function GlassEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animationRef = useRef<number>();

  // Glass parameters
  const params = {
    width: ${params.width},
    height: ${params.height},
    mouseX: ${params.mouseX},
    mouseY: ${params.mouseY},
    tintR: ${params.tintR},
    tintG: ${params.tintG},
    tintB: ${params.tintB},
    saturation: ${params.saturation},
    distortion: ${params.distortion},
    blur: ${params.blur},
    iconColorR: ${params.iconColorR},
    iconColorG: ${params.iconColorG},
    iconColorB: ${params.iconColorB},
    glassMode: '${params.glassMode}',
    shadowIntensity: ${params.shadowIntensity},
    shadowOffsetX: ${params.shadowOffsetX},
    shadowOffsetY: ${params.shadowOffsetY},
    shadowBlur: ${params.shadowBlur},
    cornerRadius: ${params.cornerRadius},
    chromaticAberration: ${params.chromaticAberration},
    shape: ${shapeValue},
    donutThickness: ${params.donutThickness},
    starPoints: ${params.starPoints},
    starInnerRadius: ${params.starInnerRadius}
  };

  const vertexShaderSource = \`
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  \`;

  const fragmentShaderSource = \`
    precision mediump float;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform sampler2D u_texture;
    uniform float u_width;
    uniform float u_height;
    uniform vec3 u_tint;
    uniform float u_saturation;
    uniform float u_distortion;
    uniform float u_blur;
    uniform float u_cornerRadius;
    uniform float u_chromaticAberration;
    uniform float u_shape;
    uniform float u_donutThickness;
    uniform float u_starPoints;
    uniform float u_starInnerRadius;
    uniform float u_shadowIntensity;
    uniform vec2 u_shadowOffset;
    uniform float u_shadowBlur;
    uniform float u_glassMode;
    
    varying vec2 v_texCoord;
    
    #define PI 3.141592653589793
    
    // Shape SDF functions
    float sdRoundedRect(vec2 pos, vec2 halfSize, float radius) {
      vec2 q = abs(pos) - halfSize + radius;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
    }
    
    float sdCircle(vec2 pos, float radius) {
      return length(pos) - radius;
    }
    
    float sdStar(vec2 pos, float outerRadius, float innerRadius, int points) {
      float angle = atan(pos.y, pos.x);
      float radius = length(pos);
      float segmentAngle = 2.0 * PI / float(points);
      float segment = floor(angle / segmentAngle + 0.5);
      float segmentStart = segment * segmentAngle;
      float localAngle = angle - segmentStart;
      float halfSegment = segmentAngle * 0.5;
      float t = abs(localAngle) / halfSegment;
      float targetRadius = mix(outerRadius, innerRadius, t);
      return radius - targetRadius;
    }
    
    float sdHexagon(vec2 pos, float size) {
      const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
      pos = abs(pos);
      pos -= 2.0 * min(dot(k.xy, pos), 0.0) * k.xy;
      pos -= vec2(clamp(pos.x, -k.z * size, k.z * size), size);
      return length(pos) * sign(pos.y);
    }
    
    float sdDonut(vec2 pos, float outerRadius, float thickness) {
      float innerRadius = outerRadius * (1.0 - thickness);
      float d = length(pos);
      return max(d - outerRadius, innerRadius - d);
    }
    
    float getShapeSDF(vec2 pos) {
      if (u_shape < 0.5) {
        return sdRoundedRect(pos, vec2(u_width, u_height), u_cornerRadius);
      } else if (u_shape < 1.5) {
        return sdCircle(pos, min(u_width, u_height));
      } else if (u_shape < 2.5) {
        float outerRadius = min(u_width, u_height) * 0.8;
        float innerRadius = outerRadius * u_starInnerRadius;
        return sdStar(pos, outerRadius, innerRadius, int(u_starPoints));
      } else if (u_shape < 3.5) {
        return sdHexagon(pos, min(u_width, u_height) * 0.8);
      } else {
        return sdDonut(pos, min(u_width, u_height) * 0.8, u_donutThickness);
      }
    }
    
    vec3 saturate(vec3 color, float factor) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(gray), color, factor);
    }
    
    vec3 sampleBlurred(vec2 uv, float blurAmount) {
      vec3 color = vec3(0.0);
      float total = 0.0;
      
      for (float x = -2.0; x <= 2.0; x += 1.0) {
        for (float y = -2.0; y <= 2.0; y += 1.0) {
          vec2 offset = vec2(x, y) * blurAmount / u_resolution;
          float weight = exp(-(x*x + y*y) / (2.0 * blurAmount * blurAmount));
          color += texture2D(u_texture, uv + offset).rgb * weight;
          total += weight;
        }
      }
      
      return color / total;
    }
    
    void main() {
      vec2 fragCoord = v_texCoord * u_resolution;
      vec2 centeredUV = fragCoord - u_mouse;
      float sdf = getShapeSDF(centeredUV);
      
      // Background
      vec3 bgColor = texture2D(u_texture, v_texCoord).rgb;
      
      // Glass effect
      float normalizedInside = (sdf / u_height) + 1.0;
      float boxMask = 1.0 - clamp(sdf, 0.0, 1.0);
      
      if (boxMask > 0.0) {
        // Distortion
        vec2 distortedUV = v_texCoord;
        if (u_distortion > 0.0) {
          vec2 grad = vec2(
            getShapeSDF(centeredUV + vec2(2.0, 0.0)) - getShapeSDF(centeredUV - vec2(2.0, 0.0)),
            getShapeSDF(centeredUV + vec2(0.0, 2.0)) - getShapeSDF(centeredUV - vec2(0.0, 2.0))
          );
          grad = normalize(grad);
          float offsetAmount = pow(abs(normalizedInside), 12.0) * -0.05 * u_distortion;
          distortedUV += grad * offsetAmount;
        }
        
        // Blur and chromatic aberration
        vec3 glassColor = sampleBlurred(distortedUV, u_blur * 3.0);
        
        if (u_chromaticAberration > 0.0) {
          vec2 center = vec2(0.5);
          vec2 direction = normalize(distortedUV - center);
          float dist = length(distortedUV - center);
          float aberration = u_chromaticAberration * dist * 0.01;
          
          float r = sampleBlurred(distortedUV + direction * aberration * 1.2, u_blur * 3.0).r;
          float g = glassColor.g;
          float b = sampleBlurred(distortedUV - direction * aberration * 0.8, u_blur * 3.0).b;
          glassColor = vec3(r, g, b);
        }
        
        // Apply effects
        glassColor = saturate(glassColor, u_saturation);
        glassColor *= u_tint;
        
        // Highlights
        float edgeBlendFactor = pow(normalizedInside, 12.0);
        float highlightAmount = mix(0.0, 0.3, clamp(edgeBlendFactor, 0.0, 1.0));
        glassColor += vec3(highlightAmount);
        
        // Shadow
        if (u_shadowIntensity > 0.0) {
          vec2 shadowPos = centeredUV - u_shadowOffset;
          float shadowSdf = getShapeSDF(shadowPos);
          float shadowMask = 1.0 - clamp(shadowSdf / u_shadowBlur, 0.0, 1.0);
          shadowMask *= u_shadowIntensity;
          bgColor = mix(bgColor, bgColor * (1.0 - shadowMask), shadowMask);
        }
        
        gl_FragColor = vec4(mix(bgColor, glassColor, boxMask), 1.0);
      } else {
        gl_FragColor = vec4(bgColor, 1.0);
      }
    }
  \`;

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    // Create shaders
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;
    programRef.current = program;

    // Setup geometry
    const vertices = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const texLoc = gl.getAttribLocation(program, 'a_texCoord');
    
    gl.enableVertexAttribArray(posLoc);
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

    // Load texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = '${design.backgroundUrl}';
    textureRef.current = texture;

    // Render loop
    const render = () => {
      if (!gl || !program || !texture) return;

      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);

      // Set uniforms
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), Date.now() / 1000);
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), params.mouseX * devicePixelRatio, params.mouseY * devicePixelRatio);
      gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_width'), params.width);
      gl.uniform1f(gl.getUniformLocation(program, 'u_height'), params.height);
      gl.uniform3f(gl.getUniformLocation(program, 'u_tint'), params.tintR, params.tintG, params.tintB);
      gl.uniform1f(gl.getUniformLocation(program, 'u_saturation'), params.saturation);
      gl.uniform1f(gl.getUniformLocation(program, 'u_distortion'), params.distortion);
      gl.uniform1f(gl.getUniformLocation(program, 'u_blur'), params.blur);
      gl.uniform1f(gl.getUniformLocation(program, 'u_cornerRadius'), params.cornerRadius);
      gl.uniform1f(gl.getUniformLocation(program, 'u_chromaticAberration'), params.chromaticAberration);
      gl.uniform1f(gl.getUniformLocation(program, 'u_shape'), params.shape);
      gl.uniform1f(gl.getUniformLocation(program, 'u_donutThickness'), params.donutThickness);
      gl.uniform1f(gl.getUniformLocation(program, 'u_starPoints'), params.starPoints);
      gl.uniform1f(gl.getUniformLocation(program, 'u_starInnerRadius'), params.starInnerRadius);
      gl.uniform1f(gl.getUniformLocation(program, 'u_shadowIntensity'), params.shadowIntensity);
      gl.uniform2f(gl.getUniformLocation(program, 'u_shadowOffset'), params.shadowOffsetX, params.shadowOffsetY);
      gl.uniform1f(gl.getUniformLocation(program, 'u_shadowBlur'), params.shadowBlur);
      gl.uniform1f(gl.getUniformLocation(program, 'u_glassMode'), params.glassMode === 'dark' ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createShader, createProgram]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      {/* Text/Icon Overlay */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: params.mouseX,
          top: params.mouseY,
          transform: 'translate(-50%, -50%)',
          fontSize: Math.min(params.width, params.height) * ${params.iconSize},
          color: \`rgb(\${Math.round(params.iconColorR * 255)}, \${Math.round(params.iconColorG * 255)}, \${Math.round(params.iconColorB * 255)})\`,
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        ${params.text}
      </div>
    </div>
  );
}

/*
 * CONFIGURATION:
 * Shape: ${params.shape}
 * Dimensions: ${params.width}x${params.height}px
 * Effects: Blur ${params.blur}, Distortion ${params.distortion}, Saturation ${params.saturation}
 * Chromatic Aberration: ${params.chromaticAberration}
 * Shadow: ${params.shadowIntensity} @ (${params.shadowOffsetX}, ${params.shadowOffsetY})
 * 
 * USAGE:
 * 1. Install React in your project
 * 2. Copy this component to your project
 * 3. Use <GlassEffect /> in your app
 * 4. Customize params object for interactive controls
 */`;
  };

  return (
    <>
      {/* Save Design Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-10 px-3"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
            <DialogDescription>
              Give your design a name to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="design-name">Design Name</Label>
            <Input
              id="design-name"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="My Glass Design"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveDesign();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDesign}>
              Save Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Designs Folder */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="h-10 px-3"
          >
            <Folder className="h-4 w-4 mr-2" />
            Saved Designs
            {savedDesigns.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-background/20 rounded">
                {savedDesigns.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Saved Designs</DialogTitle>
            <DialogDescription>
              Load, edit, or export your saved glass designs.
            </DialogDescription>
          </DialogHeader>
          
          {savedDesigns.length === 0 ? (
            <div className="py-12 text-center">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No saved designs yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Save" to save your current design
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {savedDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{design.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(design.createdAt).toLocaleDateString()} at{' '}
                          {new Date(design.createdAt).toLocaleTimeString()}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="px-2 py-1 bg-muted rounded">
                            {design.params.shape}
                          </span>
                          <span className="px-2 py-1 bg-muted rounded">
                            {design.params.width}×{design.params.height}
                          </span>
                          <span className="px-2 py-1 bg-muted rounded">
                            blur: {design.params.blur}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadDesign(design)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportCode(design)}
                        >
                          <Code className="h-4 w-4 mr-1" />
                          Code
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDesign(design.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Code Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Export Code - {selectedDesign?.name}</DialogTitle>
            <DialogDescription>
              Copy or download the React component code for this design.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertDescription>
              This code includes the complete WebGL shader implementation with all effects: distortion, 
              chromatic aberration, blur, shadows, and shape rendering. Ready to use in any React project.
            </AlertDescription>
          </Alert>

          <ScrollArea className="h-[400px] w-full rounded-md border">
            <pre className="p-4 text-sm">
              <code>{generatedCode}</code>
            </pre>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleCopyCode}>
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownloadCode}>
              <Download className="h-4 w-4 mr-2" />
              Download .tsx
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
