const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Create a new project
router.post('/', verifyToken, async (req, res) => {
  console.log("Request body from create project API: ", req.body);
  const { newProjectName, newProjectDeadline, newProjectTitle, newProjectImportance, newProjectDescription } = req.body;
  const owner = req.user.id;


  const existingProject = await Project.findOne({name:newProjectName});
  if(existingProject)
  {
    res.json({message:"Project already exists", projectExists: true});
    return;
  }
  console.log("Existing Project: ", existingProject);

  try {
    const project = new Project({ name: newProjectName, deadline: newProjectDeadline, title: newProjectTitle, importance: newProjectImportance, description: newProjectDescription, owner });
    await project.save();
    res.json(project);
  } catch (error) {
    console.log("Create Project Error: ", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's projects
router.get('/', verifyToken, async (req, res) => {
  const owner = req.user.id;

  try {
    const projects = await Project.find({ owner });
    res.json(projects);
  } catch (error) {
    console.log("Get Projects Error", error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Delete a project
router.delete('/:id', verifyToken, async (req, res) => {
  const projectId = req.params.id;
  const owner = req.user.id;

  try {
    const project = await Project.findOne({ _id: projectId, owner: owner });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Fetch a project by ID
router.get('/:id', verifyToken, async (req, res) => {
  const projectId = req.params.id;
  const owner = req.user.id;

  try {
    const project = await Project.findOne({ _id: projectId, owner: owner });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }


    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});




module.exports = router;
