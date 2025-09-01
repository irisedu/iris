{ pkgs ? import <nixpkgs> {} }:

# https://zeroes.dev/p/nix-recipe-for-postgresql/
let
  postgresConf = pkgs.writeText "postgresql.conf" ''
  '';
in pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs_22
    pnpm
    postgresql
    valkey # redis
    versitygw
    awscli2
  ];

  PGDATA = toString ./.pg;

  shellHook = ''
    export PGHOST="$PGDATA"

    export AWS_ENDPOINT_URL=http://127.0.0.1:7070
    export AWS_ACCESS_KEY_ID=versitygw
    export AWS_SECRET_ACCESS_KEY=secret
    export AWS_REGION=us-east-1

    if [ ! -f .shell-lock ]; then
        CWD=$(pwd)

        [ ! -d $PGDATA ] && echo "Initializing database..." && pg_ctl initdb -o "-U postgres" && cat ${postgresConf} >> $PGDATA/postgresql.conf

        touch .shell-lock
        echo "Starting PostgreSQL..."
        pg_ctl -o "-p 5555 -k $PGDATA" start


        echo "Starting Valkey..."
        valkey-server --port 6666 --daemonize yes

        echo "Starting versitygw..."
        mkdir -p ./obj/gw ./obj/versioning
        versitygw --port 127.0.0.1:7070 --access versitygw --secret secret posix --versioning-dir $PWD/obj/versioning $PWD/obj/gw &
        VERSITY_PID=$!

        trap "echo Stopping services...; pg_ctl stop; valkey-cli -p 6666 shutdown; kill $VERSITY_PID; rm .shell-lock" EXIT
    fi

    alias pg="psql -p 5555 -U postgres"
    alias pg-gen="pnpm db:codegen --url=postgres://postgres@127.0.0.1:5555/iris"

    alias vk="valkey-cli -p 6666"
  '';
}
