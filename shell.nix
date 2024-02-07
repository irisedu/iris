{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs_21
    nodejs_21.pkgs.pnpm
  ];
}
