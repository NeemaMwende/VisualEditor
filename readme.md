## First, clone the project - Run the following command in your terminal to clone the project:
git clone https://github.com/NeemaMwende/VisualEditor.git

## Then, navigate into the project directory:
cd VisualEditor

## Install Dependencies
Before running the project, install the required Node.js dependencies using npm:
npm install

## Run the Development Server
To start the project in development mode, run:
npm run dev
This will start the Next.js application at:
http://localhost:3000

  - Pull command: `docker pull neemamwende/visualeditor`
  - Run command: `docker run -p 3000:3000 neemamwende/visualeditor` - Docker runs the production build inside a container, isolated from your local environment
  -  or `npm run dev` - runs in development mode with hot reloading, directly on your machine
