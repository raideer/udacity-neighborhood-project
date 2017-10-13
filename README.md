# Udacity Neighborhood Map Project
This project is for for Udacity's **Full Stack nanodegree program**.  
This is a single page application that features a map of the _Old Town in Riga_.
The map suggests venues based on a category, provided by Foursquare API. This
application also implements the default Google Places functionality via SearchBox.
The frontend runs on **knockout.js** and **bootstrap 4** framework and everything is bundled together with **webpack**. This project also uses functionality from ES2017
that is later compiled by babel.

# Setting up and making changes
Follow these steps to successfully run this application

### 1. Downloading the repository
To obtain all required project files, just clone the repository with   
`git clone https://github.com/raideer/udacity-neighborhood-project`

### 2. Navigate to the project files
At this point you already can open the `index.html` document in your browser and
see the project in action, but if you wish to make further changes to the project,
proceed to the next step.

### 3. Installing dependencies
All dependencies are managed by NPM (node package manager). Installing them is
easy, just run: `npm install`

### 4. Making changes and building the project
After making changes to the project, you'll have to run the bundler for changes
to appear in the browser. You can do that by running `npm run build` or `npm run watch` which will watch for any changes to the project and run the builder automatically.

# Preview images
![Default suggestions](https://i.imgur.com/03hq2a4.png)
![Foursquare suggestion preview](https://i.imgur.com/gy1FHEn.png)
![Google place details](https://i.imgur.com/P6I5eZC.png)
![Google place reviews](https://i.imgur.com/QXYN0fQ.png)
