const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Create a new task
router.post('/', verifyToken, async (req, res) => {
  const { name, projectId, expiryDate, importance, description } = req.body;
  console.log("Request body from tasks/: ", req.body);
  const inviteLink = `${req.protocol}://${req.get('host')}/task/${Math.random().toString(36).substring(2, 15)}`;


  const existingTask = Project.findById(projectId);

  console.log("Existing Tasks from Project: ", existingTask.tasks);


  try {
    const project = await Project.findById(projectId);
    console.log("Project: ", project);
    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const task = new Task({ name, project: projectId, inviteLink, expiryDate, owner: req.user._id, importance, description });
    await task.save();

    project.tasks.push(task._id);
    await project.save();

    res.json(task);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});




// Delete a particular Task
router.delete('/:projectId', verifyToken, async (req, res) => {
  const projectId = req.params.projectId;
  const { taskId } = req.body;
  console.log(taskId);
  console.log(req.user);

  try {
    const project = await Project.findById(projectId);
    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const taskIndex = project.tasks.findIndex((task) => task.toString() === taskId);
    console.log("taskIndex: ", taskIndex);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found - This error is comming' });
    }

    project.tasks.splice(taskIndex, 1);
    await project.save();

    res.json({ message: 'Task deleted successfully', taskDeleted: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});





// Get tasks for a project
router.get('/:projectId', verifyToken, async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const project = await Project.findById(projectId).populate('tasks');
    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project.tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});






//Get a particular task
router.get('/task/:taskId', verifyToken, async (req, res) => {
  const taskId = req.params.taskId;
  const viewOnly = req.query.viewOnly === 'true';

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isMainUser = project.owner.toString() === req.user.id;

    res.json({ task, isMainUser, viewOnly });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});



//Submit task API
router.put('/:taskId/submit', verifyToken, async (req, res) => {
  const taskId = req.params.taskId;
  console.log("TaskID : ", taskId);

  try {
    const user = await User.findById(req.user.id);
    console.log("user from task/Submit: ", user);

    const task = await Task.findByIdAndUpdate(taskId, {
      $addToSet: { submittedBy: { userId: user._id, userFirstName: user.firstname, userLastName: user.lastname } },
      submitted: true
    }, { new: true }).populate('submittedBy.userId', 'firstname lastname');

    console.log("request params: ", req.params.taskId, "Request body: ", req.body);
    console.log("Task from task/submit API: ", task);
    console.log("Request user Id: ", req.user.id.toString());
    console.log("Task owner Id: ", task.owner.toString());

    res.send(task);

  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error, message: "Internal server error" });
  }
});






// Get submitted tasks for a project
router.get('/submitted/:projectId', verifyToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const tasks = await Task.find({ project: projectId, submitted: true });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


//Save the code API
router.put('/task/:taskId/save', async (req, res) => {

  const { taskId } = req.params;
  const { code, language } = req.body;
  console.log("Code: ", code, " Language: ", language);

  try {
    // Find the task by ID and update its code
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

     const existingSnippet = task.codeSnippets.find(snippet => snippet.language === language);

     if (existingSnippet) {
       // Update the code for the existing language
       existingSnippet.code = code;
     } else {
       // Add a new code snippet for the language
       task.codeSnippets.push({ language, code });
     }

     await task.save();
 

    res.status(200).json({ message: 'Code saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving code', error });
  }
});





// Get code for a specific task and language
router.get('/get-code/:taskId/:language', async (req, res) => {
  const { taskId, language } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const snippet = task.codeSnippets.find(snippet => snippet.language === language);
    const code = snippet ? snippet.code : '';

    
    res.status(200).json({ code });
  } catch (error) {
    console.error('Error fetching code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports = router;
