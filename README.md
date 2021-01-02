# ewake
Web application that manages computers to wake up via WakeOnLan

# Installation
Install with npm:

```bash
npm install
```

Install with pnpm:

```bash
pnpm install
```

Install with yarn:

```bash
yarn
```

# Introduction
ewake is an application that helps you manage your WOL-enabled computers. 

It allows users to start their computers themselves via a web frontend (no SSH access is needed anymore to send the magic packet).
```http request
http://localhost:5555/etherwake?user=1thorsten
```
The administration (creation and deletion) is done via a simple REST API.
```http request
PUT http://localhost:5555/manageClients
Content-Type: application/json

{
"name": "1thorsten",
"description": "serv1",
"mac": "E4:54:E8:A4:17:1F",
"ip": "10.40.4.162",
"check": "tcp:3389"
}

###

DELETE http://localhost:5555/manageClients
Content-Type: application/json

{
  "mac": "E4:54:E8:A4:17:1F",
  "ip": "10.40.4.162"
}
```

ewake shows which computers are currently running by applying the specified check (e.g. check tcp-port 3389).
```http request
http://localhost:5555/activeClients
```
ewake records the actions to detect problems easier.
```http request
http://localhost:5555/check
```

# Get it to work
## direct without docker
ewake uses webpack to put all the components into a dependency-free javascript file that is simply executed using node.

Thus, only the resulting javascript file is needed on the server running ewake. The modules needed for development (node_modules) are no longer needed here.

Compilation of ewake to a file:
```bash
npm run build:dist
```

Execution of ewake:
```bash
cd dist/ewake
node ewake.js
```

You can also just download the latest release from [here](https://github.com/1thorsten/ewake/releases).

## with docker
- Pull the latest image and start the container (after cloning the repo)
```
docker-compose -f ./docker/docker-compose.yml pull
docker-compose up -d
```
- from github (without anything cloning the repo)
```
curl -s https://raw.githubusercontent.com/1thorsten/ewake/main/docker/docker/docker-compose.yml | docker-compose -f - up
```