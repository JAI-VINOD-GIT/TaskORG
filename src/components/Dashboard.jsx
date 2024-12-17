import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css";
import LogoutModal from "./LogoutModal";

const Dashboard = ({ setIsAuthenticated }) => {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [newTask, setNewTask] = useState("");
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const fetchTasks = async () => {
      const { data } = await axios.get("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched tasks:", data);
      setTasks(data);
    };

    const fetchUser = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Could not fetch user data.");
      }
    };

    fetchTasks();
    fetchUser();
  }, [setIsAuthenticated]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setShowLogoutModal(false);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const addTask = async () => {
    if (newTask.trim() === "") {
      toast.error("Please enter a task before adding.");
      return;
    }

    console.log("New task title:", newTask);

    const taskExists = tasks.some(
      (task) => task.title?.toLowerCase() === newTask.trim().toLowerCase()
    );
    if (taskExists) {
      toast.error("This task already exists.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Please log in.");
      return;
    }

    try {
      const { data } = await axios.post(
        "http://localhost:5000/tasks",
        { title: newTask },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("New task data:", data, newTask);
      const updatedTasks = tasks.map((task) =>
        task.status === "inProgress" ? { ...task, status: "pending" } : task
      );

      setTasks([...updatedTasks, { ...data, status: "inProgress" }]);
      setNewTask("");
      toast.success("Task added successfully.");
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Could not add task.");
      } else if (error.request) {
        toast.error("Server did not respond. Please try again later.");
      } else {
        toast.error("Error occurred. Please try again.");
      }
      console.error("Error adding task:", error);
    }
  };

  const deleteTask = async (taskId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((task) => task.id !== taskId));
      toast.success("Task deleted successfully.");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Could not delete task. Please try again.");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/tasks/${taskId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(
        tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
      );
      toast.success("Task status updated successfully.");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Could not update task status. Please try again.");
    }
  };

  const handleEditTask = async (taskId) => {
    const token = localStorage.getItem("token");
    const taskExists = tasks.some(
      (task) =>
        task.id !== taskId &&
        task.title &&
        task.title.toLowerCase() === editTaskTitle.trim().toLowerCase()
    );

    if (taskExists) {
      toast.error("This task title already exists.");
      return;
    }

    try {
      const { data } = await axios.put(
        `http://localhost:5000/tasks/${taskId}`,
        { title: editTaskTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, title: data.title } : task
        )
      );
      setEditTaskId(null);
      setEditTaskTitle("");
      toast.success("Task updated successfully.");
    } catch (error) {
      console.error("Error editing task:", error);
      toast.error("Could not edit task. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditTaskId(null);
    setEditTaskTitle("");
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="task-body">
      <nav className="navbar navbar-expand-lg navbar-light  position-relative">
        <div className="video-background">
          <video
            src="/assets/videos/bg_video.mp4"
            autoPlay
            loop
            muted
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: -1,
            }}
            className="video-background__video"
          ></video>
        </div>
        <div className="container-fluid position-relative">
          <span className="navbar-text">
            <h2>{user ? ` ${user.username}'s Dashboard` : "Loading..."}</h2>
          </span>
          <button onClick={handleLogout} className="btn btn-danger ml-auto">
            Logout
          </button>
        </div>
      </nav>
      <div className="text-center  position-relative">
        <div
          className={`task-container ${
            tasks.length === 0 ? "center-container" : "default-container"
          }`}
        >
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New Task"
            className="form-control task-input"
          />
          <button onClick={addTask} className="btn btn-primary mt-3">
            Add Task
          </button>
        </div>

        {tasks.length > 0 && (
          <div className="table-container mt-4 ">
            <h3>Task Management</h3>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search Task"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control w-50 mx-auto"
              />
            </div>

            <div className="table-responsive">
              <table className="table table-striped table-hover mt-4">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      className={editTaskId === task.id ? "edit-mode" : ""}
                      key={task.id}
                    >
                      <td>
                        {editTaskId === task.id ? (
                          <input
                            type="text"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                          />
                        ) : (
                          task.title
                        )}
                      </td>
                      <td>{task.status}</td>
                      <td className="action-buttons">
                        {editTaskId === task.id ? (
                          <>
                            <button
                              className="btn btn-primary btn-rounded btn-save-cancel"
                              onClick={() => handleEditTask(task.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary btn-rounded btn-save-cancel"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : task.status !== "completed" ? (
                          <>
                            <button
                              className="icon-button btn btn-warning"
                              onClick={() => {
                                setEditTaskId(task.id);
                                setEditTaskTitle(task.title);
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="icon-button btn btn-success"
                              onClick={() =>
                                updateTaskStatus(task.id, "completed")
                              }
                            >
                              <FaCheck />
                            </button>
                          </>
                        ) : null}

                        {editTaskId !== task.id && (
                          <button
                            className="icon-button btn btn-danger"
                            onClick={() => deleteTask(task.id)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ToastContainer />

      <LogoutModal
        show={showLogoutModal}
        onClose={closeLogoutModal}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default Dashboard;
