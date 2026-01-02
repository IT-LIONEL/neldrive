import { ArrowLeft, Code2, Shield, Zap, Copy, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ApiDocs = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = "https://rzjvlwrzqvtagsemscav.supabase.co/functions/v1";

  const endpoints = [
    {
      method: "POST",
      path: "/hide-data",
      description: "Hide data within an image using LSB steganography",
      request: `{
  "imageData": "base64_encoded_rgba_pixel_data",
  "width": 1920,
  "height": 1080,
  "data": "Your secret message or base64 file content",
  "type": "text",  // "text" | "url" | "audio" | "image" | "document"
  "password": "optional_encryption_password"
}`,
      response: `{
  "success": true,
  "data": {
    "resultImageData": "base64_encoded_rgba_pixels_with_hidden_data",
    "width": 1920,
    "height": 1080,
    "encrypted": false,
    "type": "text",
    "originalDataSize": 25,
    "capacity": 6220700
  },
  "meta": {
    "processingTime": "45ms",
    "version": "1.0"
  }
}`
    },
    {
      method: "POST",
      path: "/extract-data",
      description: "Extract hidden data from an image",
      request: `{
  "imageData": "base64_encoded_rgba_pixel_data",
  "password": "optional_decryption_password"
}`,
      response: `{
  "success": true,
  "data": {
    "type": "text",
    "content": "Your secret message",
    "encrypted": false,
    "contentSize": 25
  },
  "meta": {
    "processingTime": "32ms",
    "version": "1.0"
  }
}`
    },
    {
      method: "GET/POST",
      path: "/check-capacity",
      description: "Calculate the maximum data capacity for an image",
      request: `// GET: ?width=1920&height=1080
// POST:
{
  "width": 1920,
  "height": 1080
}`,
      response: `{
  "success": true,
  "data": {
    "width": 1920,
    "height": 1080,
    "pixels": 2073600,
    "capacityBytes": 6220700,
    "capacityFormatted": "5.93 MB",
    "capacityCharacters": 6220700,
    "estimatedProcessingTime": "1.0s",
    "recommendations": [
      "Large capacity. Suitable for any type of hidden data."
    ]
  },
  "meta": {
    "processingTime": "1ms",
    "version": "1.0"
  }
}`
    }
  ];

  const jsExample = `// Helper function to get RGBA pixel data from an image
async function getImageData(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve({
        data: imageData.data,
        width: img.width,
        height: img.height
      });
    };
    img.src = imageUrl;
  });
}

// Convert Uint8ClampedArray to base64
function arrayToBase64(array) {
  return btoa(String.fromCharCode(...array));
}

// Hide data in image
async function hideData(imageUrl, secretData, password = null) {
  const { data, width, height } = await getImageData(imageUrl);
  
  const response = await fetch('${baseUrl}/hide-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: arrayToBase64(data),
      width,
      height,
      data: secretData,
      type: 'text',
      password
    })
  });
  
  return await response.json();
}

// Extract data from image
async function extractData(imageUrl, password = null) {
  const { data } = await getImageData(imageUrl);
  
  const response = await fetch('${baseUrl}/extract-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: arrayToBase64(data),
      password
    })
  });
  
  return await response.json();
}

// Usage example
const result = await hideData('image.png', 'Secret message!', 'password123');
console.log(result);`;

  const pythonExample = `import requests
import base64
from PIL import Image
import numpy as np

BASE_URL = "${baseUrl}"

def get_image_data(image_path):
    """Load image and return RGBA pixel data as base64"""
    img = Image.open(image_path).convert('RGBA')
    pixels = np.array(img).flatten()
    return base64.b64encode(bytes(pixels)).decode(), img.width, img.height

def hide_data(image_path, secret_data, password=None):
    """Hide data in an image"""
    image_data, width, height = get_image_data(image_path)
    
    response = requests.post(
        f"{BASE_URL}/hide-data",
        json={
            "imageData": image_data,
            "width": width,
            "height": height,
            "data": secret_data,
            "type": "text",
            "password": password
        }
    )
    return response.json()

def extract_data(image_path, password=None):
    """Extract hidden data from an image"""
    image_data, _, _ = get_image_data(image_path)
    
    response = requests.post(
        f"{BASE_URL}/extract-data",
        json={
            "imageData": image_data,
            "password": password
        }
    )
    return response.json()

# Usage
result = hide_data("image.png", "Secret message!", "password123")
print(result)`;

  const curlExample = `# Check capacity
curl -X POST "${baseUrl}/check-capacity" \\
  -H "Content-Type: application/json" \\
  -d '{"width": 1920, "height": 1080}'

# Hide data (requires base64 encoded RGBA pixel data)
curl -X POST "${baseUrl}/hide-data" \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageData": "BASE64_RGBA_PIXELS",
    "width": 1920,
    "height": 1080,
    "data": "Secret message",
    "type": "text",
    "password": "optional_password"
  }'

# Extract data
curl -X POST "${baseUrl}/extract-data" \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageData": "BASE64_RGBA_PIXELS",
    "password": "optional_password"
  }'`;

  const dataTypes = [
    { type: "text", description: "Plain text messages" },
    { type: "url", description: "URLs and links" },
    { type: "audio", description: "Audio files (base64)" },
    { type: "image", description: "Image files (base64)" },
    { type: "document", description: "Documents (base64)" }
  ];

  const errorCodes = [
    { code: "400", description: "Bad Request - Invalid input data" },
    { code: "405", description: "Method Not Allowed - Wrong HTTP method" },
    { code: "500", description: "Internal Server Error - Processing failed" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to App</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">NELHIDE API</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            NELHIDE API Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Steganography API for hiding and extracting data from images
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Code2 className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold mb-2">RESTful API</h3>
            <p className="text-sm text-muted-foreground">
              Simple HTTP endpoints for hiding and extracting data from images using LSB steganography.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-cyan-500/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="font-semibold mb-2">Encryption Support</h3>
            <p className="text-sm text-muted-foreground">
              Optional AES-256-GCM encryption with password protection for sensitive data.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-blue-500/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Fast Processing</h3>
            <p className="text-sm text-muted-foreground">
              Optimized edge functions with sub-second processing for most images.
            </p>
          </div>
        </div>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Base URL</h2>
          <div className="flex items-center gap-2 p-4 rounded-xl bg-card border border-border/50 font-mono text-sm">
            <code className="flex-1 text-emerald-400 break-all">{baseUrl}</code>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => copyToClipboard(baseUrl, "baseUrl")}
            >
              {copiedEndpoint === "baseUrl" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-3">
                  <Badge
                    className={`font-mono text-xs ${
                      endpoint.method === "POST"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-medium">{endpoint.path}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={() => copyToClipboard(baseUrl + endpoint.path, endpoint.path)}
                  >
                    {copiedEndpoint === endpoint.path ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">{endpoint.description}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Request</h4>
                      <pre className="p-3 rounded-lg bg-background/50 text-xs overflow-x-auto border border-border/30">
                        <code className="text-cyan-300">{endpoint.request}</code>
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Response</h4>
                      <pre className="p-3 rounded-lg bg-background/50 text-xs overflow-x-auto border border-border/30">
                        <code className="text-emerald-300">{endpoint.response}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Code Examples</h2>
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="w-full justify-start bg-card border border-border/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="javascript" className="rounded-lg">JavaScript</TabsTrigger>
              <TabsTrigger value="python" className="rounded-lg">Python</TabsTrigger>
              <TabsTrigger value="curl" className="rounded-lg">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="javascript">
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="p-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-sm font-medium">JavaScript / TypeScript</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(jsExample, "js")}
                  >
                    {copiedEndpoint === "js" ? (
                      <Check className="h-3 w-3 mr-2 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="p-4 text-xs overflow-x-auto max-h-96">
                  <code className="text-cyan-300">{jsExample}</code>
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="python">
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="p-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-sm font-medium">Python</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(pythonExample, "python")}
                  >
                    {copiedEndpoint === "python" ? (
                      <Check className="h-3 w-3 mr-2 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="p-4 text-xs overflow-x-auto max-h-96">
                  <code className="text-cyan-300">{pythonExample}</code>
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="curl">
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                <div className="p-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-sm font-medium">cURL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(curlExample, "curl")}
                  >
                    {copiedEndpoint === "curl" ? (
                      <Check className="h-3 w-3 mr-2 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="p-4 text-xs overflow-x-auto max-h-96">
                  <code className="text-cyan-300">{curlExample}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Data Types */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Supported Data Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {dataTypes.map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-card border border-border/50 text-center">
                <Badge variant="outline" className="mb-2 font-mono">{item.type}</Badge>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Error Handling */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Error Handling</h2>
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <p className="text-sm text-muted-foreground">All endpoints return a consistent error format:</p>
              <pre className="mt-3 p-3 rounded-lg bg-background/50 text-xs border border-border/30">
                <code className="text-red-300">{`{
  "success": false,
  "error": "Descriptive error message",
  "needsPassword": true  // Only for extract-data when password is required
}`}</code>
              </pre>
            </div>
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3">Common Error Codes</h4>
              <div className="space-y-2">
                {errorCodes.map((error, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="font-mono bg-red-500/10 text-red-400 border-red-500/30">
                      {error.code}
                    </Badge>
                    <span className="text-muted-foreground">{error.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            NELHIDE API — Secure steganography as a service
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ApiDocs;
