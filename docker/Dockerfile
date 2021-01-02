FROM node:14-alpine
LABEL maintainer="Thorsten Winkler"
LABEL description="ewake"

ENV NODE_ENV=production

VOLUME [ "/ewake-clients" ]

ADD dist/ewake /ewake/

WORKDIR /ewake

RUN set -x && \
    # add shebang line for all js-files without those from resources
    find . -name 'resources' -prune -o -name '*.js' -exec sed -i '1i #!/usr/bin/env node' {} \; && \
    chmod a+x *.js && \
    # away with that shitty CR
    find . -name "*.sh" -exec sed -i 's/\r$//' {} \; && \
    find . -name "*.js" -exec sed -i 's/\r$//' {} \; && \
    find . -name "*.json" -exec sed -i 's/\r$//' {} \; && \
    set +x

CMD ["ewake.js","--file=/ewake-clients/clients.json","--port=5555"]


