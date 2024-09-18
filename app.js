const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const app = express();
const port = 3000;
const filePath = path.join(__dirname, "userData.txt");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Serve HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Helper function to save user data to a text file
const saveUserToFile = (email, hashedPassword) => {
  const dataToSave = `
Email: ${email}
Password: ${hashedPassword}
---------------------------------------------
`;
  fs.appendFileSync(filePath, dataToSave);
};

// Helper function to read user data from a text file
const readUserDataFromFile = () => {
  const data = fs.readFileSync(filePath, "utf-8");
  const users = data
    .split("---------------------------------------------\n")
    .map((block) => {
      const [emailLine, passwordLine] = block.split("\n").filter((line) => line);
      if (!emailLine || !passwordLine) return null;
      const email = emailLine.split("Email: ")[1];
      const password = passwordLine.split("Password: ")[1];
      return { email, password };
    })
    .filter((user) => user);
  return users;
};

// Signup logic
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = readUserDataFromFile();

    // Check if the user already exists
    if (users.some((user) => user.email === email)) {
      return res.status(400).send("User already registered");
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user data to the file
    saveUserToFile(email, hashedPassword);

    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).send("Error during signup");
  }
});

// Login logic
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = readUserDataFromFile();

    // Find the user by email
    const user = users.find((user) => user.email === email);
    if (!user) {
      return res.status(400).send("User not found");
    }

    // Compare the entered password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send("Incorrect password");
    }

    res.status(200).send("Login successful");
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Error during login");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
