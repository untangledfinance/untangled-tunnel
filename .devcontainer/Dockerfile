ARG NODE_VERSION=22
FROM node:${NODE_VERSION}

RUN apt-get update && \
    apt-get install git sudo -y && \
    apt-get clean

WORKDIR /tmp
COPY scripts/*.sh .
RUN chmod +x *.sh

ARG USER
RUN deluser node && ./create-user.sh ${USER}
RUN chown ${USER}:sudo .

ARG WORKSPACE
ARG PROFILE
RUN mv load-*.sh /home/${USER}/ && \
    usermod -aG sudo ${USER} && \
    echo "%sudo ALL=(ALL:ALL) ALL" | EDITOR="tee -a" visudo && \
    echo ". ~/load-env.sh ${WORKSPACE} ${PROFILE}" >> /home/${USER}/.bashrc && \
    echo ". ~/load-completions.sh" >> /home/${USER}/.bashrc

USER ${USER}
RUN ./install-bun.sh