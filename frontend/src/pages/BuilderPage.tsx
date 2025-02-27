import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from "axios";
import { FolderOpen, Code2, Eye, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { FileStructure, Step, StepType } from '../types';
import { parseXml } from '../steps';


const BuilderPage = () => {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  // console.log(prompt);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);



  const [fileStructure, setFileStructure] = useState<FileStructure[]>([]);

  useEffect(() => {
    let originalFiles = [...fileStructure];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {

      setFileStructure(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
        
      }))
    }
    // console.log(fileStructure);
  }, [steps, fileStructure]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim(),
    })
    
    const {prompts, uiPrompts} = response.data;
    // console.log(prompts);

    setSteps(parseXml(uiPrompts[0]).map((x:Step)=>({
      ...x,
      status:"pending",
    })));

    // const requestData = {
    //   contents: [...prompts, prompt].map((content) => ({
    //     role: "user",
    //     parts: [{ text: content }],
    //   })),
    // };
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      contents: [...prompts, prompt].map((content) => ({
        role: "user",
        parts: [{ text: content }],
      })),
    })

    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);
    
    // console.log("Request Payload:", JSON.stringify(requestData, null, 2)); // Pretty print the JSON
    // const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, requestData); 

    console.log(stepsResponse.data.response);
  }

  useEffect(() => {
    init();
  }, [prompt]);

  const findFileContent = (path: string): string | undefined => {
    const pathParts = path.split('/');
    let current: FileStructure[] = fileStructure;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const found = current.find(item => item.name === part);

      if (!found) return undefined;

      if (i === pathParts.length - 1) {
        return found.content;
      }

      if (found.children) {
        current = found.children;
      } else {
        return undefined;
      }
    }

    return undefined;
  };

  const toggleFolder = (path: string[]) => {
    const updateStructure = (items: FileStructure[], currentPath: string[]): FileStructure[] => {
      return items.map(item => {
        if (item.name === currentPath[0]) {
          if (currentPath.length === 1) {
            return { ...item, isOpen: !item.isOpen };
          }
          return {
            ...item,
            children: item.children ? updateStructure(item.children, currentPath.slice(1)) : []
          };
        }
        return item;
      });
    };
    setFileStructure(updateStructure(fileStructure, path));
  };

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderFileTree = (items: FileStructure[], path: string[] = []) => {
    return (
      <ul className="pl-4">
        {items.map((item) => (
          <li key={item.name} className="py-1">
            <div
              className={`flex items-center cursor-pointer hover:bg-gray-700 rounded px-2 py-1 ${selectedFile === [...path, item.name].join('/') ? 'bg-gray-700' : ''
                }`}
              onClick={() => {
                if (item.type === 'folder') {
                  toggleFolder([...path, item.name]);
                } else {
                  setSelectedFile([...path, item.name].join('/'));
                }
              }}
            >
              {item.type === 'folder' ? (
                <FolderOpen className="w-4 h-4 mr-2 text-yellow-500" />
              ) : (
                <Code2 className="w-4 h-4 mr-2 text-blue-500" />
              )}
              <span>{item.name}</span>
            </div>
            {item.type === 'folder' && item.isOpen && item.children &&
              renderFileTree(item.children, [...path, item.name]
              )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Steps Panel - 25% */}
        <div className="w-1/4 bg-gray-800 p-4 border-r border-gray-700 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Steps</h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg transition-colors ${step.status === 'completed' ? 'bg-gray-700/50' :
                    step.status === 'in_progress' ? 'bg-blue-900/20 border border-blue-500/30' :
                      step.status === 'error' ? 'bg-red-900/20 border border-red-500/30' :
                        'bg-gray-700/30'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{step.title}</h3>
                  {getStepIcon(step.status)}
                </div>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* File Explorer - 25% */}
        <div className="w-1/4 bg-gray-800 p-4 border-r border-gray-700 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">File Explorer</h2>
          {renderFileTree(fileStructure)}
        </div>

        {/* Code/Preview Panel - 50% */}
        <div className="w-1/2 bg-gray-800">
          <div className="border-b border-gray-700">
            <div className="flex">
              <button
                className={`px-4 py-2 ${activeTab === 'code' ? 'bg-gray-700 text-white' : 'text-gray-400'
                  }`}
                onClick={() => setActiveTab('code')}
              >
                <div className="flex items-center">
                  <Code2 className="w-4 h-4 mr-2" />
                  Code
                </div>
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'preview' ? 'bg-gray-700 text-white' : 'text-gray-400'
                  }`}
                onClick={() => setActiveTab('preview')}
              >
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </div>
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-41px)]">
            {activeTab === 'code' ? (
              selectedFile ? (
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  theme="vs-dark"
                  value={findFileContent(selectedFile) || '// Empty file'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on'
                  }}
                />
              ) : (
                <div className="p-4 text-gray-400">Select a file to view its contents</div>
              )
            ) : (
              <iframe
                title="Preview"
                className="w-full h-full bg-white"
                src="about:blank"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;