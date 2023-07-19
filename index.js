const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const uri =
  "mongodb+srv://rosskeene196:cqK6L7UsxwEDvWce@cluster0.kf5a24r.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const Schema = mongoose.Schema;

const exerciseUsersSchema = new Schema({
  username: { type: String, unique: true, required: true },
});

const ExerciseUsers = mongoose.model("ExerciseUsers", exerciseUsersSchema);

const exercisesSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, min: 1, required: true },
  date: { type: Date, default: Date.now },
});

const Exercises = mongoose.model("Exercises", exercisesSchema);

app.post("/api/users", function (req, res) {
  if (req.body.username === "") {
    return res.json({ error: "username is required" });
  }

  let username = req.body.username;

  ExerciseUsers.findOne({ username: username })
    .then((data) => {
      if (!data) {
        let newUser = new ExerciseUsers({
          username: username,
          exercises: [], // Initialize the exercises property as an empty array
        });

        newUser.save()
          .then((savedUser) => {
            return res.json({
              _id: savedUser._id,
              username: savedUser.username,
              exercises: savedUser.exercises, // Initialize the exercises property as an empty array
            });
          })
          .catch((err) => {
            return res.json({ error: "Error saving user to the database" });
          });
      } else {
        return res.json({ error: "username already exists" });
      }
    })
    .catch((err) => {
      return res.json({ error: "Error finding user in the database" });
    });
});


app.get("/api/users", async function (req, res) {
  try {
    const users = await ExerciseUsers.find({});
    return res.json(users);
  } catch (err) {
    return res.json({ error: 'Error fetching users from the database' });
  }
});


app.post("/api/users/:_id/exercises", async function (req, res) {
  if (req.params._id === "0" || !mongoose.Types.ObjectId.isValid(req.params._id)) {
    return res.json({ error: "_id is invalid" });
  }

  if (req.body.description === "") {
    return res.json({ error: "description is required" });
  }

  if (req.body.duration === "") {
    return res.json({ error: "duration is required" });
  }

  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date !== undefined ? new Date(req.body.date) : new Date();

  if (isNaN(duration)) {
    return res.json({ error: "duration is not a number" });
  }

  if (isNaN(date.getTime())) {
    return res.json({ error: "date is invalid" });
  }

  try {
    const user = await ExerciseUsers.findById(userId);
    if (!user) {
      return res.json({ error: "user not found" });
    }

    const newExercise = new Exercises({
      userId: userId,
      description: description,
      duration: duration,
      date: date,
    });

    const savedExercise = await newExercise.save();

    // Update the user object with the new exercise fields
    user.exercises.push(savedExercise);
    await user.save();

    // Return the updated user object with the exercise fields added
    return res.json({
      _id: user._id,
      username: user.username,
      exercises: user.exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      })),
    });
  } catch (err) {
    console.error("Error saving exercise:", err); // Log the error for debugging
    return res.json({ error: "Error saving exercise to the database" });
  }
});

app.get("/api/users/:_id/exercises", async function (req, res) {
  const userId = req.params._id;
  const findConditions = { userId: userId };

  if (
    (req.query.from !== undefined && req.query.from !== "") ||
    (req.query.to !== undefined && req.query.to !== "")
  ) {
    findConditions.date = {};

    if (req.query.from !== undefined && req.query.from !== "") {
      findConditions.date.$gte = new Date(req.query.from);
    }

    if (isNaN(findConditions.date.$gte.getTime())) {
      return res.json({ error: "from date is invalid" });
    }

    if (req.query.to !== undefined && req.query.to !== "") {
      findConditions.date.$lte = new Date(req.query.to);
    }

    if (isNaN(findConditions.date.$lte.getTime())) {
      return res.json({ error: "to date is invalid" });
    }
  }

  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;

  if (isNaN(limit)) {
    return res.json({ error: "limit is not a number" });
  }
  if (req.params._id === "0" || !mongoose.Types.ObjectId.isValid(req.params._id)) {
    return res.json({ error: "_id is invalid" });
  }

  try {
    const user = await ExerciseUsers.findById(userId);
    if (!user) {
      return res.json({ error: "user not found" });
    }

    const newExercise = new Exercises({
      userId: userId,
      description: description,
      duration: duration,
      date: date,
    });

    const savedExercise = await newExercise.save();

    // Initialize the exercises array if it's not defined
    if (!user.exercises) {
      user.exercises = [];
    }

    // Update the user object with the new exercise fields
    user.exercises.push(savedExercise);
    await user.save();

    // Return the updated user object with the exercise fields added
    return res.json({
      _id: user._id,
      username: user.username,
      exercises: user.exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      })),
    });
  } catch (err) {
    console.error("Error saving exercise:", err); // Log the error for debugging
    return res.json({ error: "Error saving exercise to the database" });
  }
});




app.get("/api/users/:_id/logs", async function (req, res) {
  const userId = req.params._id;
  const findConditions = { userId: userId };

  if (req.query.from || req.query.to) {
    findConditions.date = {};
    if (req.query.from) {
      findConditions.date.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      findConditions.date.$lte = new Date(req.query.to);
    }
  }

  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit <= 0) {
    limit = 0;
  }

  try {
    const user = await ExerciseUsers.findById(userId);
    if (!user) {
      return res.json({ error: "user not found" });
    }

    const exercises = await Exercises.find(findConditions).limit(limit);
    const log = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(), // Format the date as a string
    }));

    return res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length, // Number of exercises
      log: log,
    });
  } catch (err) {
    return res.json({ error: "Error fetching user or exercises from the database" });
  }
});




app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    errMessage = err.errors[keys[0]].message;
  } else {
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }

  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
