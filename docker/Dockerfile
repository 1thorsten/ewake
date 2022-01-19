FROM node:16-alpine
LABEL maintainer="Thorsten Winkler"
LABEL description="ewake"
ARG USER=ewake

ENV NODE_ENV=production
ENV NODE_OPTIONS=--enable-source-maps
ENV TZ=Europe/Berlin
ENV EWAKE_PORT=5555
ENV EWAKE_JSON_FILE=/ewake-clients/clients.json
#ENV EWAKE_JSON_HTTP
#ENV EWAKE_JSON_HTTP_WRITE
#ENV EWAKE_NETWORK_INTERFACE

VOLUME [ "/ewake-clients" ]

ADD dist/ewake /ewake/

WORKDIR /ewake

RUN set -x && \
    apk add --update --no-cache tzdata sudo && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone && \
    chmod 0500 /ewake/ewake.js && \
    adduser -D $USER && \
    echo "$USER ALL=(ALL) NOPASSWD:SETENV: /ewake/ewake.js" > /etc/sudoers.d/$USER && \
    chmod 0440 /etc/sudoers.d/$USER && \
    # away with that shitty CR
    find . -name "*.sh" -exec sed -i 's/\r$//' {} \; && \
    find . -name "*.js" -exec sed -i 's/\r$//' {} \; && \
    find . -name "*.json" -exec sed -i 's/\r$//' {} \; && \
    apk del tzdata && \
    set +x

#USER $USER

CMD sudo -E /ewake/ewake.js


