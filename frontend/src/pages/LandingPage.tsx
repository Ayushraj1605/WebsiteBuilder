import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

const LandingPage = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wand2 className="w-16 h-16 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Website Builder AI</h1>
          <p className="text-gray-400">Describe your website and let AI do the magic</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your website (e.g., 'Create a modern portfolio website with a dark theme...')"
              className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition duration-200"
          >
            Generate Website
          </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;