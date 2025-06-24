# Untangled Tunnel

This repository contains the codebase of the [Untangled SSH Server](ssh://ssh.untangled.finance) (the Tunnel). The Tunnel is a simple (and useful) solution to allow our members (mainly developers) to access internal services, which are privately running in our Kubernetes cluster, via secure SSH connections (_Yep! Via secure Secure Shell connections!_). The Tunnel is deployed within the network that the target services are running in (or at least, it can establish a TCP connection from the Tunnel to them, to make it work).

## Usage

To connect to the Tunnel, run:

```sh
ssh <username>@ssh.untangled.finance -N -L :<port>:<service>:69
```

where:

- `<username>` is the authentication username,
- `ssh.untangled.finance` is the domain pointing to deployment of the Tunnel,
- `-N` is to tell that we don't need to execute any command (and indeed, we mustn't do it),
- `-L` is to use the SSH local port-forwarding (tunneling) feature,
- `<service>` is the target service to connect,
- `<port>` is the local port to bind, and
- `69` is, nah, just a random syntactic number we choose to hide the underlying port of the target service.

Once the SSH connection is established, you can connect to the target service via `localhost:<port>`.

> [!TIP]
> You can save the following configuration in your `~/.ssh/config` file to quickly connect to the Untangled SSH Server without typing this long command:
>
> ```ssh
> Host untangled
>   HostName ssh.untangled.finance
>   User example
>   IdentityFile ~/.ssh/id_rsa
>   SessionType none
>   LocalForward 27017 mongo:69
>   LocalForward 6379 redis:69
> ```
>
> and then run `ssh untangled` to start "tunneling" to these internal `mongo` and `redis` services at their respective ports.

## Authentication

By default, the Tunnel accepts only public-key authentication. Therefore, to successfully connect to it, public key (or authorized key) of the user needs to be added into the Tunnel's database. In this implementation, we use a light-weight MongoDB instance to store authorized keys of the users as well as the port bindings (see this [schema](/src/models/Tunnel.ts)). Those are also used for other proxy/tunneling functionalities in the Untangled platform (yes, they're in our private repositories; however, internally, the Tunnel highly depends on the [untangled-web](https://www.npmjs.com/package/untangled-web) package, and the package is now open-sourced in the [untangled-web](https://github.com/untangledfinance/untangled-web) repository).

An HTTP server is running along with the Tunnel and is designated to expose specific endpoints to (1) add an authorized key of a user to the Tunnel, (2) grant a user the permission to connect to an internal service, and (3) revoke the permission of a user to an internal service (for more details, please take a look at the [TunnelController](/src/controllers/tunnel.ts) implementation).

## Getting Started

In order to start the Tunnel locally, you can use [Bun](https://bun.sh) to run:

```sh
bun install
bun start
```

There should be errors thrown due to some required configurations are missing, I bet you can figure it out yourself by looking at the code flow (starting at [this file](/src/index.ts)).

For builds, run `bun run build` to create a single `index.js` file inside `./dist` folder. Please check the `build` script in [package.json](/package.json) so as to customize this step.

The Tunnel is ready to run in any JavaScript runtime. We suggest [containerizing our Bun application](https://bun.sh/guides/ecosystem/docker) with this minimal (but not optimal) [Dockerfile](/Dockerfile). The pre-builds are available in our [GitHub Packages](https://github.com/untangledfinance/untangled-tunnel/pkgs/container/untangled-tunnel). Now, just pull the latest version and start running your own local Tunnel:

```sh
docker pull ghcr.io/untangledfinance/untangled-tunnel:<version>
```

## Contributing

Feel free to [create an issue](https://github.com/untangledfinance/untangled-tunnel/issues/new) if needed to improve the implementation of "our" Tunnel.

## License

To be honest, there shouldn't be a license for the Tunnel, use it freely at your own risk. However, we have to add a [LICENSE](/LICENSE.md) file (MIT) to make this repository look more professional.
