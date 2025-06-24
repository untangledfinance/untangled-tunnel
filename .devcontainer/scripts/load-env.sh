#!/bin/bash

workspace=$1
profile=$2
env_source=/workspaces/$workspace/$profile.env

if [ -f $env_source ]; then
    set -o allexport
    . $env_source
    set +o allexport
fi