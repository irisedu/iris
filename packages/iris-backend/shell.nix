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
  ];

  PGDATA = toString ./.pg;

  shellHook = ''
    export PGHOST="$PGDATA"

    [ ! -d $PGDATA ] && echo "Initializing database..." && pg_ctl initdb -o "-U postgres" && cat ${postgresConf} >> $PGDATA/postgresql.conf
    echo "Starting PostgreSQL..."
    pg_ctl -o "-p 5555 -k $PGDATA" start

    echo "Starting Valkey..."
    valkey-server --port 6666 --daemonize yes

    trap "echo Stopping databases... && pg_ctl stop && valkey-cli -p 6666 shutdown" EXIT

    alias pg="psql -p 5555 -U postgres"
    alias pg-gen="pnpm db:codegen --url=postgres://postgres@127.0.0.1:5555/iris"

    alias vk="valkey-cli -p 6666"
  '';
}
