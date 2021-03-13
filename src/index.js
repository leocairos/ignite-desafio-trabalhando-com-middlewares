const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  // Complete aqui
  const {username} = request.headers;
  
  if (username){
    const userRequest = users.find(user => user.username === username);
    if (userRequest){
      request.user = userRequest;
      return next();
    } else {
      return response.status(404).json({error: 'Username not found'});
    }
  } else {
    return response.status(404).json({error: 'Username is required'});
  }
}

function checksCreateTodosUserAvailability(request, response, next) {
  // Complete aqui 
  if (request.user.todos.length <= 10 || request.user.pro){
      return next();    
  } else {
    return response.status(403);
  }
}

function checksTodoExists(request, response, next) {
  // Complete aqui
  const { username } = request.headers;
  const { id } = request.params;
  if ( !validate(id) ) {    
      return response.status(400).json({error: 'ID is invalid UUID'});
  }
  if (username){
    const userFound = users.find(user => user.username === username);
    if (userFound){
      const todoUser = userFound.todos.find(todo => todo.id === id);
      if (todoUser) {
        request.todo = todoUser;
        request.user = userFound;
        return next();          
      } else {
        return response.status(404).json({error: 'todo ID is not found to user'});
      }      
    } else {
      return response.status(404).json({error: 'Username not found'});
    }
  } else {
    return response.status(404).json({error: 'Username is required'});
  }
}

function findUserById(request, response, next) {
  // Complete aqui  
  try{
    console.log('\n\n\nAAAAAAAArequest.parms',request.parms, '\n\n\n')
    const { id } = request.parms;
    console.log('\n\n\nBBBBBBBB id', id, '\n\n\n')
    if (id){
      const userRequest = users.find(user => user.id === id);
      if (userRequest){
        request.user = userRequest;
        return next();
      } else {
        return response.status(404).json({error: 'id not found'});
      }
    } else {
      return response.status(404).json({error: 'id is required'});
    }
  } catch (err){
    return response.status(404).json({error: 'Erro'});
  }
  
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { user, todo } = request;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};