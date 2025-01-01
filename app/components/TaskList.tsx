import React from 'react';
import TaskCard from '@/app/components/TaskCard';
import { reviewTask } from '../utils/typeProvider';

const TaskList = ({ tasks }: { tasks: reviewTask[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <TaskCard key={task.taskId} task={task} />
      ))}
    </div>
  );
};

export default TaskList;