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
## direct without Docker
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

## with Docker
### network = host
network should be host to use all features (e.g. dissolving client mac-address)

- manage clients with a file (no cluster possible)
```bash
docker run -d --restart unless-stopped --network host -e EWAKE_PORT=5555 -v ewake-clients:/ewake-clients --name ewake 1thorsten/ewake:latest
```
- manage clients through http (cluster mode)
you can link the client-resource for reading the data
```bash
docker run -d --restart unless-stopped --network host -e EWAKE_PORT=5555 -e EWAKE_JSON_HTTP=https://raw.githubusercontent.com/1thorsten/ewake/main/src/resources/client.json --name ewake 1thorsten/ewake:latest
```
- manage clients through http and write via dav (cluster mode)
you can use e.g. https://github.com/1thorsten/http-over-all for manage the client-resource. http-over-all offers access via http and also dav. So ewake can write the data back from every running instance. Perfect for shared usage.
```bash
docker run -d --restart unless-stopped --network host -e EWAKE_PORT=5555 -e EWAKE_JSON_HTTP=http://http-over-all:8338/mysamba/clients.json -e EWAKE_JSON_HTTP_WRITE=http://http-over-all:8338/dav/mysamba/clients.json --name ewake 1thorsten/ewake:latest
```
### network = bridged
on Windows and mac network=host does not work properly
```bash
docker run -d --restart unless-stopped -p 5555:5555 -v ewake-clients:/ewake-clients --name ewake 1thorsten/ewake:latest
```
- manage clients through http (cluster mode)
  you can link the client-resource for reading the data
```bash
docker run -d --restart unless-stopped -p 5555:5555 -e EWAKE_JSON_HTTP=https://raw.githubusercontent.com/1thorsten/ewake/main/src/resources/client.json --name ewake 1thorsten/ewake:latest
```
- manage clients through http and write via dav (cluster mode)
  you can use e.g. https://github.com/1thorsten/http-over-all for manage the client-resource. http-over-all offers access via http and also dav. So ewake can write the data back from every running instance. Perfect for shared usage.
```bash
docker run -d --restart unless-stopped -p 5555:5555 -e EWAKE_JSON_HTTP=http://http-over-all:8338/mysamba/clients.json -e EWAKE_JSON_HTTP_WRITE=http://http-over-all:8338/dav/mysamba/clients.json --name ewake 1thorsten/ewake:latest
```
