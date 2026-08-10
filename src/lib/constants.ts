import { Task } from '../types';

export const DEFAULT_CURRENCY = 'LKR';

export const DEFAULT_GLOBAL_TASKS: Task[] = [
  { id: 'task-1', name: 'Business Development', category: 'Sales & Growth', isBillableDefault: true, defaultRate: 6000 },
  { id: 'task-2', name: 'UI/UX Design', category: 'Design', isBillableDefault: true, defaultRate: 5000 },
  { id: 'task-3', name: 'Graphic Design', category: 'Design', isBillableDefault: true, defaultRate: 4500 },
  { id: 'task-4', name: 'Frontend Development', category: 'Engineering', isBillableDefault: true, defaultRate: 5000 },
  { id: 'task-5', name: 'Backend Development', category: 'Engineering', isBillableDefault: true, defaultRate: 5500 },
  { id: 'task-6', name: 'Mobile Development', category: 'Engineering', isBillableDefault: true, defaultRate: 5500 },
  { id: 'task-7', name: 'Testing / QA', category: 'Engineering', isBillableDefault: true, defaultRate: 4000 },
  { id: 'task-8', name: 'Project Management', category: 'Management', isBillableDefault: true, defaultRate: 5000 },
  { id: 'task-9', name: 'Digital Marketing', category: 'Marketing', isBillableDefault: true, defaultRate: 4000 },
  { id: 'task-10', name: 'SEO', category: 'Marketing', isBillableDefault: true, defaultRate: 4000 },
  { id: 'task-11', name: 'Content Creation', category: 'Marketing', isBillableDefault: true, defaultRate: 3500 },
  { id: 'task-12', name: 'Client Meeting', category: 'Client Operations', isBillableDefault: true, defaultRate: 5000 },
  { id: 'task-13', name: 'Internal Meeting', category: 'Internal Operations', isBillableDefault: false, defaultRate: 0 },
  { id: 'task-14', name: 'Research', category: 'Engineering', isBillableDefault: true, defaultRate: 4500 },
  { id: 'task-15', name: 'Deployment', category: 'DevOps', isBillableDefault: true, defaultRate: 6000 },
  { id: 'task-16', name: 'Support', category: 'Operations', isBillableDefault: true, defaultRate: 4000 },
  { id: 'task-17', name: 'Bug Fixing', category: 'Engineering', isBillableDefault: true, defaultRate: 5000 }
];

export const DEPARTMENTS = [
  'Engineering',
  'Design & UX',
  'Project Management',
  'Marketing & Growth',
  'QA & Support',
  'Executive & HR'
];
