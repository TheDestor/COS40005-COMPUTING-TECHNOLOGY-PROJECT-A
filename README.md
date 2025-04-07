# COS40005-COMPUTING-TECHNOLOGY-PROJECT-A

## Metaverse Trails 2.0: Navigating Sarawak’s Tourism Destinations

## Tech Stack
MERN (MongoDB, Express.js, React.js, Node.js)

## Prerequisities
Before you begin, ensure you have the following installed on your system:

* **Git or GitHub Desktop:** For cloning the repository and version control.
    * [Download Git] (https://git-scm.com/downloads)
    * [Download GitHub Desktop] (https://desktop.github.com/download/)
* **Node.js and npm:** Node.js includes npm (Node Package Manager).
    * [Download Node.js] (https://nodejs.org/en)

## Getting Started
Follow these steps to set up and run the project locally.

### 1. Clone the Repository
Use GitHub Desktop or Git to clone the repository onto your device.

### 2. Install Dependencies
You need to install the dependencies for both the (`frontend`) and (`backend`).

* Frontend Depedencies:
```
cd frontend
npm install
```

* Backend Dependencies:
```
cd backend
npm install
```

### 3. Configure Environmental Variables (Backend)
The backend server requires a connection to the MongoDB Atlas database. We use environmental variables for this.

* Navigate to the `backend` directory:
```
cd backend
```
* Create a `.env` file
* Open the file
* Enter the MONGO_URI=***(Replace with Connection String)***
    * Example Atlas connection string: mongodb+srv://<username>:<password>@<clustername>.mongodb.net/myDatabaseName?retryWrites=true&w=majority
* Enter the PORT=***(Replace with Port Number)***
    * Example Port Number: 5050

**Important:** The .env file contains sensitive login credentials for the database. Therefore, it is listed in `.gitignore` and must not be commited to the repository.

### 4. Running the Application
You need to run the backend and frontend servers concurrently in seperate ***cmd*** terminal windows.

**Important:** Make sure both terminals remain open for this to work.

* Start the Backend Server:
1. Navigate to the backend directory
```
cd backend
```
2. Run this command
```
node --env-file=.env server
```
3. The backend should now be running on the port specified in your `.env` file. Look for "MongoDB Connected" in the terminal.

* Start the Frontend Server:
1. Navigate to the frontend directory in a seperate terminal:
```
cd frontend
```
2. Run this command:
```
npm run dev
```
3. Look for a localhost link in the terminal to access the site. Example: `http://localhost:5173/`

4. Verify setup
    * Open the link in your browser.
    * You should see the title MERN Stack Test.
    * The message "**Message from backend: Hello from the server!**" should appear.

If you see this message, the setup is successful!