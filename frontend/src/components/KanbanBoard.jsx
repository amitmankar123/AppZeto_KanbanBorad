import React from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useDispatch, useSelector } from "react-redux";
import KanbanColumn from "./KanbanColumn.jsx";
import { moveTaskOptimistic, moveTaskOnServer } from "../slices/taskSlice.js";
import { emitTaskMoved } from "../socket/socketService.js";

const COLUMNS = ["Todo", "In Progress", "Review", "Done"];

const KanbanBoard = ({ tasks, onAddTask, onTaskClick }) => {
  const dispatch = useDispatch();
  const { currentBoard } = useSelector((state) => state.board);

  // Configure sensors for dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires moving 5px before drag triggers (avoids blocking clicks)
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the active task
    const activeTask = tasks.find((t) => t._id === activeId);
    if (!activeTask) return;

    let destinationStatus = activeTask.status;
    let destinationIndex = 0;

    // Case 1: Dropped over another task card
    const overTask = tasks.find((t) => t._id === overId);
    if (overTask) {
      destinationStatus = overTask.status;
      const colTasks = tasks.filter((t) => t.status === destinationStatus);
      destinationIndex = colTasks.findIndex((t) => t._id === overId);
    } 
    // Case 2: Dropped directly over a column container
    else if (COLUMNS.includes(overId)) {
      destinationStatus = overId;
      const colTasks = tasks.filter((t) => t.status === destinationStatus);
      destinationIndex = colTasks.length;
    } else {
      return;
    }

    // Don't do anything if target position didn't change
    const sameColumn = activeTask.status === destinationStatus;
    const sameIndex =
      tasks
        .filter((t) => t.status === destinationStatus)
        .findIndex((t) => t._id === activeId) === destinationIndex;

    if (sameColumn && sameIndex) return;

    // 1. Optimistic Update (Instant UI update)
    dispatch(
      moveTaskOptimistic({
        taskId: activeId,
        destinationStatus,
        destinationIndex,
      })
    );

    // 2. Save to database via API
    dispatch(
      moveTaskOnServer({
        taskId: activeId,
        destinationStatus,
        destinationIndex,
      })
    );

    // 3. Emit socket event to sync other users
    if (currentBoard) {
      const updatedTask = { ...activeTask, status: destinationStatus };
      emitTaskMoved(currentBoard._id, updatedTask);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6 overflow-x-auto pb-4 lg:flex-row lg:items-start lg:justify-start lg:gap-5">
        {COLUMNS.map((status) => {
          const columnTasks = tasks
            .filter((t) => t.status === status)
            .sort((a, b) => a.position - b.position);

          return (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columnTasks}
              onAddTask={onAddTask}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
