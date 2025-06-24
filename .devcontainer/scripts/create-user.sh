#!/bin/bash

user=$1
uid=1000
gid=1000

groupadd -g ${gid} -o ${user}
useradd -m -u ${uid} -g ${gid} -o -s /bin/bash ${user}
passwd -d ${user}