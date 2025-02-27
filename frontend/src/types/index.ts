export enum StepType{
    CreateFile,
    CreateFolder,
    EditFile,
    DeleteFile,
    RunScript
}

export interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
  isOpen?: boolean;
  path?:string;
}

export interface Project{
    prompt:string;
    steps:Step[];
}

export interface Step {
  id: number;
  title: string;
  type: StepType;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  description: string;
  code?:string;
  path?:string;
}