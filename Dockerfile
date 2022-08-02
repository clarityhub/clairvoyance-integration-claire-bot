FROM node:8.0.0

WORKDIR /app

EXPOSE 80

COPY ./init.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init.sh
RUN ln -s usr/local/bin/init.sh /app

ENTRYPOINT ["init.sh"]
