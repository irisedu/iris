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
  ];

  PGDATA = toString ./.pg;

  shellHook = ''
    export PGHOST="$PGDATA"

    [ ! -d $PGDATA ] && echo "Initializing database..." && pg_ctl initdb -o "-U postgres" && cat ${postgresConf} >> $PGDATA/postgresql.conf
    echo "Starting PostgreSQL..."
    pg_ctl -o "-p 5555 -k $PGDATA" start

    alias pg="psql -p 5555 -U postgres"
    trap "pg_ctl stop" EXIT
  '';
}
