'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFormation, setGeneratedFormation] = useState<any>(null);
  const [examples] = useState([
    'Create a heart formation with 100 drones',
    'Make a spiral galaxy with 200 drones',
    'Design a company logo formation',
    'Build a Christmas tree with twinkling lights',
    'Create a butterfly migration pattern',
    'Make an Olympic rings formation',
    'Design a fireworks explosion',
    'Create a waving flag formation'
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedFormation(data.data);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-400 hover:text-white">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-white">AI Formation Generator</h1>
            </div>
            <Link
              href="/show-editor"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Open Show Editor
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Generator Interface */}
          <div className="bg-gray-900 rounded-2xl p-8 mb-8">
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Describe your formation</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Create a heart formation with 100 drones that pulses with red and pink colors"
                className="w-full h-32 px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                Tip: Be specific about patterns, drone count, and movements
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isGenerating || !prompt.trim()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Formation'
                )}
              </button>
            </div>

            {/* Example Prompts */}
            <div>
              <p className="text-gray-400 text-sm mb-3">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Formation Display */}
          {generatedFormation && (
            <div className="bg-gray-900 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Generated Formation</h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Preview */}
                <div>
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      <p>3D Preview</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{generatedFormation.formation.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white">{generatedFormation.formation.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Drones:</span>
                      <span className="text-white">{generatedFormation.formation.drone_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{generatedFormation.formation.duration}s</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-gray-400 mb-4">
                      {generatedFormation.formation.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {generatedFormation.formation.tags.split(',').map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href={`/show-editor?formation=${generatedFormation.formation.id}`}
                      className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                    >
                      Add to Show Editor
                    </Link>

                    <button className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                      Export Formation
                    </button>

                    <button
                      onClick={() => {
                        setGeneratedFormation(null);
                        setPrompt('');
                      }}
                      className="w-full px-4 py-3 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800"
                    >
                      Generate Another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">AI Generation Features</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Smart Pattern Recognition</h3>
              <p className="text-gray-400 text-sm">
                AI understands complex patterns and automatically generates appropriate formations
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Customizable Parameters</h3>
              <p className="text-gray-400 text-sm">
                Control drone count, duration, colors, and movement patterns through natural language
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Instant Export</h3>
              <p className="text-gray-400 text-sm">
                Export to Blender, SkyBrush, CSV, or use directly in the show editor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
